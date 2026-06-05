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
from app.services.asaas_api_service import create_payment
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
    return _json_or_default(
        raw,
        {
            "enabled": False,
            "apiKey": "",
            "baseUrl": "https://api-sandbox.asaas.com/v3",
            "billingType": "UNDEFINED",
            "dueDays": 7,
            "descriptionTemplate": "Honorários IRPF {ano} — {nome}",
        },
    )


async def criar_cobranca_para_cliente(db: Session, body: AsaasCobrancaClienteIn) -> tuple[int, dict[str, Any]]:
    cfg = _asaas_cfg(db)
    if not cfg.get("enabled"):
        return 400, {"errors": [{"code": "disabled", "description": "Integração Asaas desativada."}]}
    key = str(cfg.get("apiKey") or "").strip()
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

    cust = (m.asaas_customer_id or "").strip()
    if not cust:
        return 400, {
            "errors": [
                {
                    "code": "missing_asaas_customer",
                    "description": "Cadastre o ID do cliente no Asaas (cus_…) no cadastro do cliente em Clientes.",
                },
            ],
        }

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

    base = str(cfg.get("baseUrl") or "https://api-sandbox.asaas.com/v3").strip()
    status, out = await create_payment(base, key, req)
    if not isinstance(out, dict):
        out = {"errors": [{"code": "unexpected", "description": str(out)[:400]}]}
    return status, out
