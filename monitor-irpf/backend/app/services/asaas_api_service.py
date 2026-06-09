import json
import re
from decimal import Decimal
from typing import Any

import httpx

from app.schemas.asaas import AsaasPaymentCreateRequest


def _asaas_body(req: AsaasPaymentCreateRequest) -> dict[str, Any]:
    raw = req.model_dump(by_alias=True, exclude_none=True)
    raw["value"] = float(Decimal(str(req.value)))
    return raw


def _headers(api_key: str) -> dict[str, str]:
    return {
        "accept": "application/json",
        "content-type": "application/json",
        "access_token": api_key,
    }


def _limpar_cpf_cnpj(valor: str) -> str:
    """Remove pontuação de CPF/CNPJ, mantendo apenas dígitos."""
    return re.sub(r"[^0-9]", "", valor)


# ---------- Customers ----------

async def get_customer_by_cpf(
    base_url: str,
    api_key: str,
    cpf_cnpj: str,
    *,
    timeout_s: float = 30.0,
) -> dict[str, Any] | None:
    """
    Pesquisa cliente no Asaas via GET /v3/customers?cpfCnpj={cpfCnpj}.
    Retorna o primeiro resultado ou None se não encontrado.
    """
    cpf_limpo = _limpar_cpf_cnpj(cpf_cnpj)
    if not cpf_limpo:
        return None

    url = f"{base_url.rstrip('/')}/customers"
    params = {"cpfCnpj": cpf_limpo}

    async with httpx.AsyncClient(timeout=timeout_s) as client:
        resp = await client.get(url, headers=_headers(api_key), params=params)

    if resp.status_code != 200:
        return None

    try:
        body = resp.json()
    except json.JSONDecodeError:
        return None

    dados = body.get("data") or []
    if isinstance(dados, list) and len(dados) > 0:
        return dados[0]
    return None


async def create_customer(
    base_url: str,
    api_key: str,
    name: str,
    cpf_cnpj: str,
    email: str | None = None,
    phone: str | None = None,
    *,
    timeout_s: float = 30.0,
) -> tuple[int, dict[str, Any]]:
    """
    Cadastra cliente no Asaas via POST /v3/customers.
    Retorna (status_code, response_body).
    """
    url = f"{base_url.rstrip('/')}/customers"
    payload: dict[str, Any] = {
        "name": name,
        "cpfCnpj": _limpar_cpf_cnpj(cpf_cnpj),
    }
    if email:
        payload["email"] = email
    if phone:
        payload["mobilePhone"] = phone

    async with httpx.AsyncClient(timeout=timeout_s) as client:
        resp = await client.post(
            url,
            headers=_headers(api_key),
            content=json.dumps(payload),
        )

    try:
        data: dict[str, Any] = resp.json()
    except json.JSONDecodeError:
        data = {"errors": [{"code": "parse_error", "description": resp.text[:500]}]}

    return resp.status_code, data


# ---------- Payments ----------

async def create_payment(
    base_url: str,
    api_key: str,
    req: AsaasPaymentCreateRequest,
    *,
    timeout_s: float = 45.0,
) -> tuple[int, dict[str, Any] | list[Any] | str]:
    """
    POST /v3/payments na API Asaas.
    Autenticação: header `access_token` com a chave da API.
    """
    url = f"{base_url.rstrip('/')}/payments"
    body = _asaas_body(req)
    async with httpx.AsyncClient(timeout=timeout_s) as client:
        resp = await client.post(url, headers=_headers(api_key), content=json.dumps(body))
    ct = (resp.headers.get("content-type") or "").lower()
    if "application/json" in ct:
        try:
            data: dict[str, Any] | list[Any] = resp.json()
        except json.JSONDecodeError:
            data = {"errors": [{"code": "parse_error", "description": resp.text[:500]}]}
    else:
        data = {"errors": [{"code": "non_json", "description": (resp.text or "")[:500]}]}
    return resp.status_code, data
