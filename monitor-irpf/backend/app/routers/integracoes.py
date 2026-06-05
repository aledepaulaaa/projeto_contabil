import base64
import json
from typing import Any

import httpx
from cryptography.hazmat.primitives.serialization import pkcs12 as crypto_pkcs12
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.cobranca import Cobranca
from app.repositories.app_kv_repository import AppKvRepository
from app.schemas.asaas_cobranca_cliente import AsaasCobrancaClienteIn
from app.schemas.rfb_diagnostico import RfbDiagnosticoIn
from app.services.asaas_cobranca_cliente_service import criar_cobranca_para_cliente
from app.services.infosimples_rfb_service import consultar_situacao_rfb_infosimples
from app.services.serpro_integra_service import (
    SAPI_AUTH_DEFAULT,
    authenticate_serpro,
    contrato_enviar,
    extrair_chave_privada_pfx,
)
from app.services.conta_azul_service import (
    obter_configuracao_conta_azul,
    salvar_configuracao_conta_azul,
    trocar_code_por_tokens,
    obter_access_token_valido,
)

router = APIRouter(prefix="/integracoes", tags=["integracoes"])

_K_ASAAS = "asaas_config_v1"
_K_SERPRO = "serpro_integra_contador_config_v1"
_K_CONTADOR = "contador_config_v1"
_K_CERT_B64 = "contador_cert_a1_b64"
_K_CERT_META = "contador_cert_a1_meta"
_K_CERT_PASS = "contador_cert_a1_pass"
_K_RFB = "rfb_infosimples_config_v1"


def _contador_p12_test_message(p12_bytes: bytes, password: str) -> tuple[bool, str]:
    """Tenta abrir o PKCS#12 com a senha dada (UTF-8); vazio tenta sem senha."""
    pwd = password.encode("utf-8") if password else b""
    try:
        key, cert, _extra = crypto_pkcs12.load_key_and_certificates(p12_bytes, pwd)
    except Exception as e:  # noqa: BLE001 — queremos mensagem legível ao utilizador
        hint = " Confirme a senha em Configurações → Contador." if not password else ""
        return False, f"Não foi possível abrir o PFX: {e!s}.{hint}"
    if key is None or cert is None:
        return False, "PFX inválido: ficheiro sem chave ou certificado utilizável."
    return True, "Certificado A1 válido: ficheiro desencriptado com a senha indicada."


def _json_or_default(raw: str | None, default: dict[str, Any]) -> dict[str, Any]:
    if not raw:
        return default
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return default


def _mask_asaas(data: dict[str, Any]) -> dict[str, Any]:
    out = dict(data)
    if out.get("apiKey"):
        out["apiKey"] = "***"
    return out


def _mask_serpro(data: dict[str, Any]) -> dict[str, Any]:
    out = dict(data)
    for k in ("consumerSecret", "accessToken", "certPassword"):
        if out.get(k):
            out[k] = "***"
    return out


def _mask_rfb(data: dict[str, Any]) -> dict[str, Any]:
    out = dict(data)
    for k in ("token", "tokenSecreto", "pkcs12Pass", "loginSenha", "pkcs12Cert", "criptografiaChave"):
        if out.get(k):
            out[k] = "***"
    return out


def _serpro_tokens_from_config(db: Session) -> dict[str, Any]:
    kv = AppKvRepository(db)
    cfg = _json_or_default(kv.get(_K_SERPRO), {})
    cert_b64 = kv.get(_K_CERT_B64)
    if not cfg.get("enabled"):
        raise ValueError("Serpro está desabilitado em serpro_integra_contador_config_v1 (enabled: false).")
    
    # Mock fallback para ambiente de desenvolvimento/teste de UI
    c_key = str(cfg.get("consumerKey") or "").strip()
    if c_key.lower().startswith("mock"):
        return {
            "access_token": "mock_access_token_para_testes",
            "token_type": "Bearer",
            "jwt_token": "mock_jwt_token",
            "expires_in": 3600
        }

    if not (cfg.get("consumerKey") and cfg.get("consumerSecret")):
        raise ValueError("Configure consumerKey e consumerSecret na config Serpro (app_kv).")
    if not cert_b64:
        raise ValueError("Envie o certificado A1 (PKCS#12) em /api/integracoes/contador/certificado/upload.")
    try:
        p12 = base64.b64decode(cert_b64)
    except (ValueError, TypeError) as e:
        raise ValueError("Certificado em Base64 inválido (contador_cert_a1_b64).") from e
    cert_pass = str(kv.get(_K_CERT_PASS) or "").strip() or str(cfg.get("certPassword") or "")
    return authenticate_serpro(
        str(cfg["consumerKey"]),
        str(cfg["consumerSecret"]),
        p12,
        cert_pass,
        auth_url=str(cfg.get("authUrl") or SAPI_AUTH_DEFAULT),
        role_type=str(cfg.get("roleType") or "TERCEIROS"),
    )


def _serpro_http_error_message(exc: httpx.HTTPStatusError) -> str:
    body = (exc.response.text or "")[:2000] if exc.response is not None else ""
    hint = ""
    try:
        if body:
            json_body = json.loads(body)
            msg = json_body.get("message", "")
            if "Role-Type" in msg:
                hint = " 💡 DICA: Verifique se o Role-Type corresponde ao tipo de certificado (e-CNPJ = TERCEIROS). Para testar a UI localmente sem credenciais, insira 'mock' no Consumer Key."
            elif exc.response.status_code == 401:
                hint = " 💡 DICA: Erro 401. Verifique se o Consumer Key/Secret estão corretos."
            elif exc.response.status_code == 403:
                hint = " 💡 DICA: Erro 403. O CNPJ do certificado pode ser diferente do cadastrado no contrato do Serpro."
            return f"SAPI HTTP {exc.response.status_code}: {msg}{hint} | Detalhes: {json.dumps(json_body.get('details', []))}"
    except json.JSONDecodeError:
        pass
    return f"SAPI HTTP {exc.response.status_code}: {body or str(exc)}{hint}"


@router.get("/asaas/config")
def asaas_config_get(db: Session = Depends(get_db)) -> dict[str, Any]:
    raw = AppKvRepository(db).get(_K_ASAAS)
    default = {
        "enabled": False,
        "apiKey": "",
        "baseUrl": "https://api-sandbox.asaas.com/v3",
        "billingType": "UNDEFINED",
        "dueDays": 7,
        "descriptionTemplate": "Honorários IRPF {ano} - {nome}",
    }
    data = _json_or_default(raw, default)
    return _mask_asaas(data)


@router.put("/asaas/config")
def asaas_config_put(payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    kv = AppKvRepository(db)
    existing = _json_or_default(kv.get(_K_ASAAS), {})
    merged = {**existing, **payload}
    if merged.get("apiKey") == "***":
        merged["apiKey"] = existing.get("apiKey") or ""
    if "dueDays" in merged and merged["dueDays"] is not None:
        try:
            merged["dueDays"] = max(0, min(365, int(merged["dueDays"])))
        except (TypeError, ValueError):
            merged["dueDays"] = int(existing.get("dueDays") or 7)
    kv.upsert(_K_ASAAS, json.dumps(merged, ensure_ascii=False))
    db.commit()
    return _mask_asaas(merged)


@router.post("/asaas/cobranca-cliente")
async def asaas_cobranca_cliente(
    payload: AsaasCobrancaClienteIn,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Cria cobrança no Asaas para um cliente da carteira (valor = honorário calculado)."""
    status, body = await criar_cobranca_para_cliente(db, payload)
    if not isinstance(body, dict):
        body = {"errors": [{"code": "unexpected_body", "description": str(body)[:500]}]}
    return JSONResponse(status_code=status, content=body)


@router.get("/serpro/config")
def serpro_config_get(db: Session = Depends(get_db)) -> dict[str, Any]:
    kv = AppKvRepository(db)
    raw = kv.get(_K_SERPRO)
    default = {
        "enabled": False,
        "consumerKey": "",
        "consumerSecret": "",
        "baseUrl": "https://gateway.apiserpro.serpro.gov.br/renda-pf-trial/v1",
        "authUrl": "https://autenticacao.sapi.serpro.gov.br/authenticate",
        "roleType": "TERCEIROS",
        "certPassword": "",
    }
    data = _json_or_default(raw, default)
    
    cert_b64 = kv.get(_K_CERT_B64)
    private_key_b64 = kv.get("serpro_private_key_base64")
    
    data["hasCert"] = bool(cert_b64)
    data["hasPrivateKey"] = bool(private_key_b64)
    
    return _mask_serpro(data)


@router.get("/rfb/config")
def rfb_config_get(db: Session = Depends(get_db)) -> dict[str, Any]:
    raw = AppKvRepository(db).get(_K_RFB)
    default = {
        "enabled": False,
        "token": "",
        "tokenSecreto": "",
        "timeoutSec": 300,
        "perfilProcuradorCnpj": "",
        "useContadorCert": True,
        "pkcs12Cert": "",
        "pkcs12Pass": "",
        "loginCpf": "",
        "loginSenha": "",
        "criptografiaChave": "",
        "criptografiaMaterial": "chave_conta",
        "criptografiaBase64Ruby": True,
        "cifrarParametrosPkcs12": None,
        "cifrarApenasPkcs12Pass": False,
    }
    data = dict(_json_or_default(raw, default))
    data.pop("callbackSecreto", None)  # campo legado (painel tem 3 chaves)
    return _mask_rfb(data)


@router.put("/rfb/config")
def rfb_config_put(payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    kv = AppKvRepository(db)
    existing = _json_or_default(kv.get(_K_RFB), {})
    merged = {**existing, **payload}
    for key in ("token", "tokenSecreto", "pkcs12Pass", "loginSenha", "pkcs12Cert", "criptografiaChave"):
        if merged.get(key) == "***":
            merged[key] = existing.get(key) or ""
    # Campo antigo (4.º) — painel InfoSimples expõe 3 chaves; remover do armazenamento ao guardar.
    merged.pop("callbackSecreto", None)
    if "timeoutSec" in merged:
        try:
            merged["timeoutSec"] = max(30, min(600, int(merged.get("timeoutSec") or 300)))
        except (TypeError, ValueError):
            merged["timeoutSec"] = int(existing.get("timeoutSec") or 300)
    if "criptografiaMaterial" in merged and merged.get("criptografiaMaterial"):
        m = str(merged["criptografiaMaterial"]).lower().strip()
        merged["criptografiaMaterial"] = m if m in ("chave_conta", "token", "token_secreto") else "chave_conta"
    if "criptografiaBase64Ruby" in merged:
        merged["criptografiaBase64Ruby"] = bool(merged.get("criptografiaBase64Ruby"))
    if "cifrarParametrosPkcs12" in merged and merged["cifrarParametrosPkcs12"] not in (True, False, None):
        merged["cifrarParametrosPkcs12"] = None
    if "cifrarApenasPkcs12Pass" in merged:
        merged["cifrarApenasPkcs12Pass"] = bool(merged.get("cifrarApenasPkcs12Pass"))
    kv.upsert(_K_RFB, json.dumps(merged, ensure_ascii=False))
    db.commit()
    return _mask_rfb(merged)


@router.post("/rfb/diagnostico")
async def rfb_diagnostico(payload: RfbDiagnosticoIn, db: Session = Depends(get_db)) -> JSONResponse:
    status, body = await consultar_situacao_rfb_infosimples(db, payload.cpf, payload.ano_calendario)
    return JSONResponse(status_code=status, content=body)


@router.put("/serpro/config")
def serpro_config_put(payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    kv = AppKvRepository(db)
    existing = _json_or_default(kv.get(_K_SERPRO), {})
    merged = {**existing, **payload}
    
    for key in ("consumerSecret", "accessToken", "certPassword"):
        if merged.get(key) == "***":
            merged[key] = existing.get(key) or ""
            
    if "certPassword" in payload and payload["certPassword"] != "***":
        senha = str(payload["certPassword"]).strip()
        if senha:
            kv.upsert(_K_CERT_PASS, senha)
            
    kv.upsert(_K_SERPRO, json.dumps(merged, ensure_ascii=False))
    db.commit()
    return _mask_serpro(merged)


@router.post("/serpro/extrair-chave")
def serpro_extrair_chave(db: Session = Depends(get_db)) -> dict[str, Any]:
    kv = AppKvRepository(db)
    cert_b64 = kv.get(_K_CERT_B64)
    if not cert_b64:
        raise HTTPException(
            status_code=400, 
            detail="Certificado A1 não enviado. Faça o upload do arquivo PFX na aba Contador primeiro."
        )
    
    cert_pass = str(kv.get(_K_CERT_PASS) or "").strip()
    try:
        chave_base64 = extrair_chave_privada_pfx(cert_b64, cert_pass)
        kv.upsert("serpro_private_key_base64", chave_base64)
        db.commit()
        return {
            "ok": True,
            "message": "Chave privada RSA extraída do certificado e salva com sucesso!"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


_SERPRO_TRIAL_TOKEN = "06aef429-a981-3ec5-a1f8-71d38d86481e"

_MOCK_RENDA_RESPONSE: dict[str, Any] = {
    "ok": True,
    "mock": True,
    "autorizacao": {
        "token": _SERPRO_TRIAL_TOKEN,
        "dataHoraRegistro": "2026-06-05T17:18:10",
        "titular": "12345678909",
        "destinatario": "33683111000107",
        "avisoLegal": (
            "O acesso a estas informações foi autorizado pelo próprio titular do dado, "
            "ou pelo representante legal no caso de pessoa jurídica, por meio de serviço "
            "oferecido pela Receita Federal. É dever do destinatário da autorização e "
            "consumidor deste acesso observar a adoção de base legal para o tratamento "
            "dos dados recebidos, conforme os artigos 7º ou 11º da LGPD "
            "(Lei nº 13.709, de 14 de agosto de 2018)."
        ),
    },
    "dados": [
        {"codigo": "1", "texto": "Rendimentos Recebidos de Pessoas Jurídicas", "valor": "152450.00"},
        {"codigo": "2", "texto": "Rendimentos Tributáveis", "valor": "120500.00"},
        {"codigo": "3", "texto": "Patrimônio Total", "valor": "850000.00"},
        {"codigo": "4", "texto": "Rendimentos Isentos e Não Tributáveis", "valor": "24150.00"},
        {"codigo": "5", "texto": "Receita de Atividade Rural", "valor": "0.00"},
        {"codigo": "6", "texto": "Rendimentos Recebidos de Pessoas Físicas - Aluguéis", "valor": "12000.00"},
        {"codigo": "7", "texto": "Ano-calendário", "valor": "2024"},
        {"codigo": "8", "texto": "Código da natureza da ocupação", "valor": "27"},
        {"codigo": "9", "texto": "Descrição do código da natureza da ocupação", "valor": "Médico"},
        {"codigo": "10", "texto": "Código da ocupação principal", "valor": "2231"},
        {"codigo": "11", "texto": "Descrição do código da ocupação principal", "valor": "Médico"},
    ],
}


@router.post("/serpro/consulta-renda")
def serpro_consulta_renda(payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    """
    Consulta dados de renda via API SERPRO.
    - Se token == trial token da documentação: retorna mock pré-descriptografado (sem custos).
    - Caso contrário: efetua chamada real à API (cobra por uso).
    """
    token = str(payload.get("tokenCompartilhamento") or "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="tokenCompartilhamento é obrigatório.")

    # ── Mock para token de demonstração da documentação SERPRO ──
    if token == _SERPRO_TRIAL_TOKEN:
        return {**_MOCK_RENDA_RESPONSE, "autorizacao": {**_MOCK_RENDA_RESPONSE["autorizacao"], "token": token}}

    # ── Chamada real (exige credenciais e certificado configurados) ──
    try:
        tokens = _serpro_tokens_from_config(db)
    except ValueError as e:
        return {"ok": False, "message": str(e)}
    except httpx.HTTPStatusError as e:
        return {"ok": False, "message": _serpro_http_error_message(e)}
    except httpx.RequestError as e:
        return {"ok": False, "message": f"Erro de rede (SAPI): {e}"}
    except Exception as e:
        return {"ok": False, "message": f"Falha na autenticação Serpro: {e}"}

    kv = AppKvRepository(db)
    cfg = _json_or_default(kv.get(_K_SERPRO), {})
    base_url = str(cfg.get("baseUrl") or "").rstrip("/")
    if not base_url:
        return {"ok": False, "message": "Configure a URL Base da API Serpro nas configurações."}

    access_token = tokens.get("access_token", "")
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }
    consult_url = f"{base_url}/Consultar/{token}"
    try:
        with httpx.Client(verify=True, timeout=30.0) as client:
            r = client.get(consult_url, headers=headers)
        if r.status_code == 404:
            return {"ok": False, "message": f"CPF não possui declaração no exercício atual (404). Token: {token}"}
        r.raise_for_status()
        data = r.json()
        return {"ok": True, "mock": False, **data}
    except httpx.HTTPStatusError as e:
        return {"ok": False, "message": _serpro_http_error_message(e)}
    except httpx.RequestError as e:
        return {"ok": False, "message": f"Erro de rede ao consultar SERPRO: {e}"}
    except Exception as e:
        return {"ok": False, "message": f"Falha inesperada na consulta: {e}"}


@router.post("/serpro/integra-contador/token")
def serpro_integra_token(db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        tokens = _serpro_tokens_from_config(db)
    except ValueError as e:
        return {"ok": False, "message": str(e)}
    except httpx.HTTPStatusError as e:
        return {"ok": False, "message": _serpro_http_error_message(e)}
    except httpx.RequestError as e:
        return {"ok": False, "message": f"Erro de rede (SAPI): {e}"}
    except Exception as e:
        return {"ok": False, "message": f"Falha na autenticação Serpro: {e}"}
    return {
        "ok": True,
        "access_token": tokens.get("access_token"),
        "token_type": tokens.get("token_type"),
        "jwt_token": tokens.get("jwt_token"),
        "expires_in": tokens.get("expires_in"),
    }


@router.post("/serpro/integra-contador/enviar")
def serpro_enviar(payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        tokens = _serpro_tokens_from_config(db)
    except ValueError as e:
        return {"ok": False, "message": str(e)}
    except httpx.HTTPStatusError as e:
        return {"ok": False, "message": _serpro_http_error_message(e)}
    except httpx.RequestError as e:
        return {"ok": False, "message": f"Erro de rede (SAPI): {e}"}
    except Exception as e:
        return {"ok": False, "message": f"Falha na autenticação Serpro: {e}"}

    kv = AppKvRepository(db)
    cfg = _json_or_default(kv.get(_K_SERPRO), {})
    access = tokens.get("access_token")
    if not access:
        return {"ok": False, "message": "Resposta SAPI sem access_token."}

    base = str(cfg.get("baseUrl") or "").strip()
    if not base:
        return {"ok": False, "message": "Configure baseUrl na config Serpro (ex.: .../integra-contador/v1)."}

    status, data = contrato_enviar(
        base,
        str(access),
        tokens.get("jwt_token"),
        payload,
        enviar_path=str(cfg.get("enviarPath") or "Contrato/Enviar"),
    )
    db.commit()

    ok_http = 200 <= status < 300
    if isinstance(data, dict):
        return {"ok": ok_http, "statusCode": status, **data}
    return {"ok": ok_http, "statusCode": status, "raw": data}


@router.get("/contador/config")
def contador_config_get(db: Session = Depends(get_db)) -> dict[str, Any]:
    raw = AppKvRepository(db).get(_K_CONTADOR)
    default: dict[str, Any] = {
        "nome": "",
        "crc": "",
        "cpf": "",
        "cnpj": "",
        "email": "",
        "telefone": "",
    }
    return {**default, **_json_or_default(raw, {})}


@router.put("/contador/config")
def contador_config_put(payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    kv = AppKvRepository(db)
    existing = _json_or_default(kv.get(_K_CONTADOR), {})
    merged = {**existing, **payload}
    kv.upsert(_K_CONTADOR, json.dumps(merged, ensure_ascii=False))
    db.commit()
    return contador_config_get(db)


@router.post("/contador/testar-certificado")
def contador_testar_certificado(db: Session = Depends(get_db)) -> dict[str, Any]:
    kv = AppKvRepository(db)
    cert_b64 = kv.get(_K_CERT_B64)
    if not cert_b64:
        return {"ok": False, "message": "Nenhum certificado enviado. Faça o upload do PFX/P12 primeiro."}
    pwd = str(kv.get(_K_CERT_PASS) or "")
    try:
        p12 = base64.b64decode(cert_b64)
    except (ValueError, TypeError) as e:
        return {"ok": False, "message": f"Certificado em Base64 inválido: {e!s}."}
    ok, msg = _contador_p12_test_message(p12, pwd)
    return {"ok": ok, "message": msg}


@router.get("/contador/certificado/info")
def contador_cert_info(db: Session = Depends(get_db)) -> dict[str, Any]:
    kv = AppKvRepository(db)
    meta = kv.get(_K_CERT_META)
    pass_raw = kv.get(_K_CERT_PASS) or ""
    b64 = kv.get(_K_CERT_B64)
    tamanho_bytes: int | None = None
    if b64:
        try:
            tamanho_bytes = len(base64.b64decode(b64))
        except (ValueError, TypeError):
            tamanho_bytes = None
    return {
        "presente": bool(b64),
        "meta": meta,
        "senha_configurada": bool(str(pass_raw).strip()),
        "tamanho_bytes_certificado": tamanho_bytes,
    }


@router.put("/contador/certificado/senha")
def contador_cert_senha_put(payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    kv = AppKvRepository(db)
    senha = str(payload.get("senha", "")).strip()
    if senha:
        kv.upsert(_K_CERT_PASS, senha)
    else:
        kv.upsert(_K_CERT_PASS, None)
    db.commit()
    return {"ok": True}


@router.post("/contador/certificado/upload")
async def contador_cert_upload(
    certificado: UploadFile = File(...),
    senha: str | None = Form(None),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    data = await certificado.read()
    if not data:
        raise HTTPException(status_code=400, detail="Ficheiro vazio ou não recebido pelo servidor.")
    b64 = base64.b64encode(data).decode("ascii")
    kv = AppKvRepository(db)
    kv.upsert(_K_CERT_B64, b64)
    kv.upsert(_K_CERT_META, json.dumps({"filename": certificado.filename}, ensure_ascii=False))
    if senha is not None:
        s = str(senha).strip()
        if s:
            kv.upsert(_K_CERT_PASS, s)
    db.flush()
    db.commit()
    return {"ok": True, "bytes_recebidos": len(data)}


@router.delete("/contador/certificado", status_code=204)
def contador_cert_delete(db: Session = Depends(get_db)) -> None:
    kv = AppKvRepository(db)
    kv.upsert(_K_CERT_B64, None)
    kv.upsert(_K_CERT_META, None)
    kv.upsert(_K_CERT_PASS, None)
    db.commit()
    return None


@router.get("/cobrancas")
def cobrancas_list(provider: str = "asaas", db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    rows = db.scalars(select(Cobranca).where(Cobranca.provider == provider).order_by(Cobranca.id.desc())).all()
    return [
        {
            "id": r.id,
            "declaracao_id": r.declaracao_id,
            "provider": r.provider,
            "status": r.status,
            "valor": float(r.valor) if r.valor is not None else None,
            "due_date": str(r.due_date) if r.due_date else None,
            "invoice_url": r.invoice_url,
            "bank_slip_url": r.bank_slip_url,
        }
        for r in rows
    ]


@router.post("/asaas/cobrancas/sincronizar-status")
def cobrancas_sync(db: Session = Depends(get_db)) -> dict[str, Any]:
    return {"ok": True, "message": "Sincronização Asaas não reimplementada."}


@router.post("/asaas/declaracoes/{declaracao_id}/boleto")
def asaas_boleto(declaracao_id: int, _payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    return {"ok": False, "message": "Emissão de boleto Asaas não reimplementada.", "declaracao_id": declaracao_id}


def _mask_conta_azul(data: dict[str, Any]) -> dict[str, Any]:
    out = dict(data)
    for k in ("clientSecret", "accessToken", "refreshToken"):
        if out.get(k):
            out[k] = "***"
    return out


@router.get("/conta-azul/config")
def conta_azul_config_get(db: Session = Depends(get_db)) -> dict[str, Any]:
    cfg = obter_configuracao_conta_azul(db)
    return _mask_conta_azul(cfg)


@router.put("/conta-azul/config")
def conta_azul_config_put(payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    existing = obter_configuracao_conta_azul(db)
    merged = {**existing, **payload}
    
    # Se enviou mascarado, recupera do existente
    for key in ("clientSecret", "accessToken", "refreshToken"):
        if merged.get(key) == "***":
            merged[key] = existing.get(key) or ""
            
    salvar_configuracao_conta_azul(db, merged)
    db.commit()
    return _mask_conta_azul(merged)


@router.post("/conta-azul/configurar-code")
def conta_azul_configurar_code(payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    code = payload.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Código de autorização não fornecido.")
    
    try:
        trocar_code_por_tokens(db, code)
        db.commit()
        return {"ok": True, "message": "Autorização realizada com sucesso!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/conta-azul/testar-conexao")
def conta_azul_testar_conexao(db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        token = obter_access_token_valido(db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro de autenticação da Conta Azul: {e}") from e

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    
    try:
        with httpx.Client(timeout=10.0) as client:
            r = client.get("https://api.contaazul.com/v1/contacts", headers=headers)
        
        if r.status_code == 200:
            return {"ok": True, "message": "Conexão com a Conta Azul estabelecida com sucesso!"}
        else:
            return {
                "ok": False,
                "message": f"Falha na conexão com a Conta Azul. Código: {r.status_code}, Resposta: {r.text}"
            }
    except httpx.RequestError as e:
        return {"ok": False, "message": f"Erro de rede ao conectar com a Conta Azul: {e}"}
    except Exception as e:
        return {"ok": False, "message": f"Falha inesperada ao testar conexão: {e}"}
