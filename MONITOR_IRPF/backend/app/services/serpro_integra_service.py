"""Cliente Serpro Integra Contador: SAPI (mTLS) + gateway Contrato/Enviar."""

from __future__ import annotations

import base64
import json
import os
import tempfile
from typing import Any

import httpx
from cryptography.hazmat.primitives.serialization import Encoding, NoEncryption, PrivateFormat, pkcs12

SAPI_AUTH_DEFAULT = "https://autenticacao.sapi.serpro.gov.br/authenticate"


def _p12_to_temp_pem_pair(p12_bytes: bytes, password: str) -> tuple[str, str]:
    pwd = password.encode("utf-8") if password else b""
    key, cert, _extra = pkcs12.load_key_and_certificates(p12_bytes, pwd)
    if key is None or cert is None:
        raise ValueError("Certificado PKCS#12 inválido ou senha incorreta.")

    cert_pem = cert.public_bytes(Encoding.PEM)
    key_pem = key.private_bytes(Encoding.PEM, PrivateFormat.PKCS8, NoEncryption())

    cf = tempfile.NamedTemporaryFile(delete=False, suffix=".pem")
    kf = tempfile.NamedTemporaryFile(delete=False, suffix=".pem")
    try:
        cf.write(cert_pem)
        kf.write(key_pem)
        cf.flush()
        kf.flush()
        return cf.name, kf.name
    finally:
        cf.close()
        kf.close()


def _cleanup_paths(paths: list[str]) -> None:
    for p in paths:
        try:
            os.unlink(p)
        except OSError:
            pass


def authenticate_serpro(
    consumer_key: str,
    consumer_secret: str,
    p12_bytes: bytes,
    cert_password: str,
    *,
    auth_url: str = SAPI_AUTH_DEFAULT,
    role_type: str = "TERCEIROS",
    timeout: float = 60.0,
) -> dict[str, Any]:
    basic = base64.b64encode(f"{consumer_key}:{consumer_secret}".encode("utf-8")).decode("ascii")
    headers = {
        "Authorization": f"Basic {basic}",
        "Role-Type": role_type,
        "Content-Type": "application/x-www-form-urlencoded",
    }
    paths = list(_p12_to_temp_pem_pair(p12_bytes, cert_password))
    try:
        with httpx.Client(verify=True, cert=(paths[0], paths[1]), timeout=timeout) as client:
            r = client.post(auth_url, headers=headers, data={"grant_type": "client_credentials"})
        r.raise_for_status()
        return r.json()
    finally:
        _cleanup_paths(paths)


def _normalize_enviar_body(body: dict[str, Any]) -> dict[str, Any]:
    out = dict(body)
    pd = out.get("pedidoDados")
    if isinstance(pd, dict):
        pd = dict(pd)
        dados = pd.get("dados")
        if isinstance(dados, dict):
            pd["dados"] = json.dumps(dados, ensure_ascii=False)
        out["pedidoDados"] = pd
    elif "dados" in out and isinstance(out["dados"], dict):
        out["dados"] = json.dumps(out["dados"], ensure_ascii=False)
    return out


def contrato_enviar(
    base_url: str,
    access_token: str,
    jwt_token: str | None,
    body: dict[str, Any],
    *,
    enviar_path: str = "Contrato/Enviar",
    timeout: float = 120.0,
) -> tuple[int, Any]:
    url = f"{base_url.rstrip('/')}/{enviar_path.lstrip('/')}"
    headers: dict[str, str] = {
        "Authorization": _strip_bearer_prefix(access_token),
        "Content-Type": "application/json",
    }
    if jwt_token:
        headers["jwt_token"] = jwt_token.strip()

    payload = _normalize_enviar_body(body)

    with httpx.Client(verify=True, timeout=timeout) as client:
        r = client.post(url, headers=headers, json=payload)

    try:
        data: Any = r.json()
    except json.JSONDecodeError:
        data = r.text
    return r.status_code, data


def _strip_bearer_prefix(token: str) -> str:
    t = token.strip()
    if t.lower().startswith("bearer "):
        t = t[7:].strip()
    return f"Bearer {t}"


def extrair_chave_privada_pfx(cert_b64: str, cert_password: str) -> str:
    """Extrai a chave privada RSA de um certificado PFX e retorna em Base64 PKCS#8 DER."""
    try:
        p12_bytes = base64.b64decode(cert_b64)
    except Exception as e:
        raise ValueError(f"Certificado Base64 inválido: {e}") from e

    pwd = cert_password.encode("utf-8") if cert_password else b""
    try:
        key, cert, _extra = pkcs12.load_key_and_certificates(p12_bytes, pwd)
    except Exception as e:
        raise ValueError(f"Falha ao abrir o certificado com a senha fornecida: {e}") from e

    if key is None:
        raise ValueError("O certificado não possui chave privada ou está corrompido.")

    pkcs8_der = key.private_bytes(
        encoding=Encoding.DER,
        format=PrivateFormat.PKCS8,
        encryption_algorithm=NoEncryption()
    )
    return base64.b64encode(pkcs8_der).decode("ascii")

