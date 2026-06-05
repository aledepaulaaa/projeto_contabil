import json
from decimal import Decimal
from typing import Any

import httpx

from app.schemas.asaas import AsaasPaymentCreateRequest


def _asaas_body(req: AsaasPaymentCreateRequest) -> dict[str, Any]:
    raw = req.model_dump(by_alias=True, exclude_none=True)
    raw["value"] = float(Decimal(str(req.value)))
    return raw


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
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "access_token": api_key,
    }
    async with httpx.AsyncClient(timeout=timeout_s) as client:
        resp = await client.post(url, headers=headers, content=json.dumps(body))
    ct = (resp.headers.get("content-type") or "").lower()
    if "application/json" in ct:
        try:
            data: dict[str, Any] | list[Any] = resp.json()
        except json.JSONDecodeError:
            data = {"errors": [{"code": "parse_error", "description": resp.text[:500]}]}
    else:
        data = {"errors": [{"code": "non_json", "description": (resp.text or "")[:500]}]}
    return resp.status_code, data
