import json
import re
from datetime import date, timedelta
from decimal import Decimal
from typing import Any

from sqlalchemy.orm import Session

from app.repositories.app_kv_repository import AppKvRepository
from app.repositories.cliente_manual_repository import ClienteManualRepository
from app.schemas.asaas import AsaasPaymentCreateRequest
from app.schemas.asaas_cobranca_cliente import AsaasCobrancaClienteIn
from app.services.asaas_api_service import create_payment, get_customer_by_cpf, create_customer
from app.services.precificacao_parametros_service import PrecificacaoParametrosService
from app.services.precificacao_valor_cliente import valor_honorario_cliente_manual

_K_ASAAS = "asaas_config_v1"
_ALLOWED_BILLING = frozenset({"UNDEFINED", "BOLETO", "CREDIT_CARD", "PIX"})


def _json_or_default(raw: str | None, default: dict[str, Any]) -> dict[str, Any]:
    if not raw:
        return default
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return default


def _asaas_cfg(db: Session) -> dict[str, Any]:
    raw = AppKvRepository(db).get(_K_ASAAS)
    cfg = _json_or_default(
        raw,
        {
            "enabled": False,
            "sandboxMode": True,
            "sandboxApiKey": "",
            "productionApiKey": "",
            "billingType": "UNDEFINED",
            "dueDays": 7,
            "descriptionTemplate": "Honorários IRPF {ano} — {nome}",
        },
    )
    
    # Derivar a chave e baseUrl correta
    is_sandbox = cfg.get("sandboxMode", True)
    if is_sandbox:
        cfg["resolvedApiKey"] = str(cfg.get("sandboxApiKey") or "").strip()
        cfg["resolvedBaseUrl"] = "https://api-sandbox.asaas.com/v3"
    else:
        cfg["resolvedApiKey"] = str(cfg.get("productionApiKey") or "").strip()
        cfg["resolvedBaseUrl"] = "https://api.asaas.com/v3"
        
    return cfg


async def _resolver_asaas_customer_id(
    db: Session,
    m: "ClienteManual",
    base_url: str,
    api_key: str,
) -> tuple[str | None, dict[str, Any] | None]:
    """
    Tenta resolver o asaas_customer_id para um ClienteManual.
    1. Se já existe, retorna direto.
    2. Pesquisa no Asaas pelo CPF.
    3. Se não encontrar, cria o cliente no Asaas.
    Retorna (customer_id, error_dict | None). Se error_dict, falhou.
    """
    cust = (m.asaas_customer_id or "").strip()
    if cust:
        return cust, None

    cpf = (m.cpf or "").strip()
    cpf_limpo = re.sub(r"[^0-9]", "", cpf)
    if not cpf_limpo:
        return None, {
            "code": "missing_cpf",
            "description": "CPF não cadastrado para este cliente. Preencha-o em Clientes para usar a cobrança automática.",
        }

    # Buscar no Asaas
    found = await get_customer_by_cpf(base_url, api_key, cpf_limpo)
    if found and isinstance(found.get("id"), str):
        cust = found["id"]
        m.asaas_customer_id = cust
        db.flush()
        return cust, None

    # Criar no Asaas
    status, data = await create_customer(
        base_url,
        api_key,
        name=m.nome or "Contribuinte",
        cpf_cnpj=cpf_limpo,
        email=m.email,
        phone=m.telefone,
    )
    if status in (200, 201) and isinstance(data.get("id"), str):
        cust = data["id"]
        m.asaas_customer_id = cust
        db.flush()
        return cust, None

    errs = data.get("errors") if isinstance(data, dict) else []
    desc = ""
    if isinstance(errs, list) and errs:
        desc = errs[0].get("description", "")
    return None, {
        "code": "asaas_customer_create_failed",
        "description": f"Falha ao criar cliente no Asaas: {desc or 'erro desconhecido'}. HTTP {status}.",
    }


async def criar_cobranca_para_cliente(db: Session, body: AsaasCobrancaClienteIn) -> tuple[int, dict[str, Any]]:
    cfg = _asaas_cfg(db)
    if not cfg.get("enabled"):
        return 400, {"errors": [{"code": "disabled", "description": "Integração Asaas desativada."}]}
    key = cfg.get("resolvedApiKey", "")
    if not key:
        return 400, {"errors": [{"code": "no_api_key", "description": "Configure a API Key em Configurações → Asaas."}]}

    if not body.estado_key.startswith("manual:"):
        return 400, {"errors": [{"code": "invalid_key", "description": "estado_key deve ser manual:{id}."}]}
    try:
        mid = int(body.estado_key.split(":", 1)[1])
    except (IndexError, ValueError):
        return 400, {"errors": [{"code": "invalid_key", "description": "estado_key inválido."}]}

    repo = ClienteManualRepository(db)
    m = repo.get(mid)
    if m is None or m.ano_carteira != body.ano_carteira:
        return 404, {"errors": [{"code": "not_found", "description": "Cliente não encontrado neste exercício."}]}

    base = cfg.get("resolvedBaseUrl", "https://api-sandbox.asaas.com/v3")

    # Se a chave for mock, interceptamos antes de validar asaas_customer_id ou calcular honorário
    if key.lower().startswith("mock"):
        due = date.today() + timedelta(days=int(cfg.get("dueDays") or 7))
        params = PrecificacaoParametrosService(db).get()
        valor = valor_honorario_cliente_manual(m, params) or Decimal("150.00")
        return 200, {
            "object": "payment",
            "id": f"pay_mock_{m.id}",
            "dateCreated": date.today().isoformat(),
            "customer": m.asaas_customer_id or "cus_mock_12345",
            "paymentLink": "https://sandbox.asaas.com/i/mock_link",
            "value": float(valor),
            "netValue": float(valor * Decimal("0.98")),
            "billingType": str(cfg.get("billingType") or "UNDEFINED").upper(),
            "status": "PENDING",
            "dueDate": due.isoformat(),
            "invoiceUrl": "https://sandbox.asaas.com/i/mock_invoice",
            "bankSlipUrl": "https://sandbox.asaas.com/i/mock_slip",
            "transactionReceiptUrl": None,
            "invoiceNumber": f"000{m.id}",
            "externalReference": f"{body.estado_key}:{body.ano_carteira}",
        }

    # Resolver customer ID automaticamente (busca por CPF → cria se necessário)
    cust, cust_err = await _resolver_asaas_customer_id(db, m, base, key)
    if cust_err:
        return 400, {"errors": [cust_err]}

    params = PrecificacaoParametrosService(db).get()
    valor = valor_honorario_cliente_manual(m, params)
    if valor is None or valor <= 0:
        return 400, {
            "errors": [{"code": "invalid_value", "description": "Valor de honorário inválido ou não definido para este cliente."}],
        }

    due_days = int(cfg.get("dueDays") or 7)
    if due_days < 0 or due_days > 365:
        due_days = 7
    due = date.today() + timedelta(days=due_days)

    bt = str(cfg.get("billingType") or "UNDEFINED").upper()
    if bt not in _ALLOWED_BILLING:
        bt = "UNDEFINED"

    tpl = str(cfg.get("descriptionTemplate") or "Honorários IRPF {ano} — {nome}")
    desc = tpl.replace("{nome}", m.nome or "").replace("{ano}", str(body.ano_carteira))
    desc = desc[:500]

    req = AsaasPaymentCreateRequest.model_validate(
        {
            "customer": cust,
            "billingType": bt,
            "value": float(valor),
            "dueDate": due.isoformat(),
            "description": desc,
            "externalReference": f"{body.estado_key}:{body.ano_carteira}",
        },
    )

    status, out = await create_payment(base, key, req)
    if not isinstance(out, dict):
        out = {"errors": [{"code": "unexpected", "description": str(out)[:400]}]}
    return status, out
