"""Serviço de Negócios para integração com a API da Conta Azul.

Gerencia o ciclo de vida da autenticação OAuth 2.0 (obtenção de chaves, troca de code, auto-refresh e persistência).
"""

from __future__ import annotations

import base64
import json
from datetime import datetime, timedelta
from typing import Any

import httpx
from sqlalchemy.orm import Session

from fastapi import HTTPException
from app.repositories.app_kv_repository import AppKvRepository

_K_CONTA_AZUL = "conta_azul_config_v1"
CONTA_AZUL_TOKEN_URL = "https://auth.contaazul.com/oauth2/token"


def obter_configuracao_conta_azul(db: Session) -> dict[str, Any]:
    """Recupera as configurações salvas da Conta Azul no banco de dados SQLite."""
    kv = AppKvRepository(db)
    raw = kv.get(_K_CONTA_AZUL)
    default = {
        "enabled": False,
        "clientId": "",
        "clientSecret": "",
        "redirectUri": "https://contaazul.com",
        "accessToken": "",
        "refreshToken": "",
        "expiresAt": "",
    }
    if not raw:
        return default
    try:
        data = json.loads(raw)
        return {**default, **data}
    except json.JSONDecodeError:
        return default


def salvar_configuracao_conta_azul(db: Session, config: dict[str, Any]) -> None:
    """Salva/atualiza as configurações da Conta Azul na tabela app_kv."""
    kv = AppKvRepository(db)
    kv.upsert(_K_CONTA_AZUL, json.dumps(config, ensure_ascii=False))
    db.flush()


def is_token_expirado(expires_at_iso: str | None) -> bool:
    """Verifica se o token expirou ou está prestes a expirar nos próximos 5 minutos."""
    if not expires_at_iso:
        return True
    try:
        expires_at = datetime.fromisoformat(expires_at_iso)
        # Limiar de segurança: 5 minutos antes da expiração oficial
        return datetime.now() >= (expires_at - timedelta(minutes=5))
    except (ValueError, TypeError):
        return True


def trocar_code_por_tokens(db: Session, code: str) -> dict[str, Any]:
    """Troca o Authorization Code recebido pelo par de tokens Access e Refresh."""
    config = obter_configuracao_conta_azul(db)
    client_id = config.get("clientId")
    client_secret = config.get("clientSecret")
    redirect_uri = config.get("redirectUri")

    if not client_id or not client_secret:
        raise ValueError("Configure Client ID e Client Secret antes de autorizar a aplicação.")

    # Constrói autenticação básica
    credentials = f"{client_id}:{client_secret}"
    basic_auth = base64.b64encode(credentials.encode("utf-8")).decode("ascii")

    headers = {
        "Authorization": f"Basic {basic_auth}",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
    }

    with httpx.Client(timeout=30.0) as client:
        r = client.post(CONTA_AZUL_TOKEN_URL, headers=headers, data=payload)
    
    if r.status_code != 200:
        raise HTTPException(
            status_code=r.status_code, 
            detail=f"Falha ao obter tokens da Conta Azul: {r.text}"
        )
    
    data = r.json()
    access_token = data.get("access_token")
    refresh_token = data.get("refresh_token")
    expires_in = int(data.get("expires_in") or 3600)

    # Atualiza as chaves no banco de dados com a expiração calculada
    config["accessToken"] = access_token
    config["refreshToken"] = refresh_token
    config["expiresAt"] = (datetime.now() + timedelta(seconds=expires_in)).isoformat()
    config["enabled"] = True

    salvar_configuracao_conta_azul(db, config)
    return config


def renovar_tokens(db: Session) -> dict[str, Any]:
    """Realiza a renovação do access_token utilizando o refresh_token."""
    config = obter_configuracao_conta_azul(db)
    client_id = config.get("clientId")
    client_secret = config.get("clientSecret")
    refresh_token = config.get("refreshToken")

    if not client_id or not client_secret:
        raise ValueError("Credenciais da Conta Azul ausentes.")
    if not refresh_token:
        raise ValueError("Nenhum refresh token disponível para renovação. Refaça a autorização.")

    credentials = f"{client_id}:{client_secret}"
    basic_auth = base64.b64encode(credentials.encode("utf-8")).decode("ascii")

    headers = {
        "Authorization": f"Basic {basic_auth}",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    payload = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
    }

    with httpx.Client(timeout=30.0) as client:
        r = client.post(CONTA_AZUL_TOKEN_URL, headers=headers, data=payload)
    
    if r.status_code != 200:
        raise Exception(f"Falha na renovação do token Conta Azul: {r.text}")
    
    data = r.json()
    access_token = data.get("access_token")
    # A Conta Azul pode ou não rotacionar o refresh token, pegamos o novo se retornado, senão mantemos o atual
    new_refresh = data.get("refresh_token") or refresh_token
    expires_in = int(data.get("expires_in") or 3600)

    config["accessToken"] = access_token
    config["refreshToken"] = new_refresh
    config["expiresAt"] = (datetime.now() + timedelta(seconds=expires_in)).isoformat()

    salvar_configuracao_conta_azul(db, config)
    return config


def obter_access_token_valido(db: Session) -> str:
    """Retorna um access_token válido, renovando-o de forma transparente se necessário."""
    config = obter_configuracao_conta_azul(db)
    if not config.get("enabled"):
        raise ValueError("A integração com a Conta Azul está desabilitada nas configurações.")
    
    access_token = config.get("accessToken")
    expires_at = config.get("expiresAt")

    if not access_token or is_token_expirado(expires_at):
        # Renova o token de forma automatizada
        config = renovar_tokens(db)
        return str(config["accessToken"])
    
    return str(access_token)
