import json
import uuid
from datetime import datetime, timezone
from typing import Any

from app.repositories.app_kv_repository import AppKvRepository

_K_CACHE = "mensagens_ecac_cache_v1"


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).replace(tzinfo=None).isoformat()


def status_label(nao_lidas: int, total: int) -> str:
    if total == 0:
        return "Sem mensagens"
    if nao_lidas <= 0:
        return "Todas lidas"
    return f"{nao_lidas} não lidas"


def _load_all(kv: AppKvRepository) -> dict[str, Any]:
    raw = kv.get(_K_CACHE)
    if not raw:
        return {}
    try:
        data = json.loads(raw)
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}


def _save_all(kv: AppKvRepository, data: dict[str, Any]) -> None:
    kv.upsert(_K_CACHE, json.dumps(data, ensure_ascii=False))


def get_ano_cache(kv: AppKvRepository, ano: int) -> dict[str, Any]:
    year = _load_all(kv).get(str(ano))
    return year if isinstance(year, dict) else {}


def get_entrada(kv: AppKvRepository, ano: int, cpf: str) -> dict[str, Any] | None:
    entry = get_ano_cache(kv, ano).get(cpf)
    return entry if isinstance(entry, dict) else None


def set_entrada(
    kv: AppKvRepository,
    ano: int,
    cpf: str,
    *,
    nome: str,
    mensagens: list[dict[str, Any]],
) -> None:
    all_data = _load_all(kv)
    year_key = str(ano)
    year = all_data.get(year_key)
    if not isinstance(year, dict):
        year = {}
    nao_lidas = sum(1 for m in mensagens if not m.get("lida"))
    year[cpf] = {
        "nome": nome,
        "mensagens": mensagens,
        "total_mensagens": len(mensagens),
        "nao_lidas": nao_lidas,
        "consultado_em": _utcnow_iso(),
    }
    all_data[year_key] = year
    _save_all(kv, all_data)


def marcar_todas_lidas(kv: AppKvRepository, ano: int, cpf: str) -> None:
    entry = get_entrada(kv, ano, cpf)
    if not entry:
        return
    mensagens = entry.get("mensagens")
    if not isinstance(mensagens, list):
        return
    for m in mensagens:
        if isinstance(m, dict):
            m["lida"] = True
    entry["nao_lidas"] = 0
    entry["total_mensagens"] = len(mensagens)
    all_data = _load_all(kv)
    year = all_data.get(str(ano), {})
    if isinstance(year, dict):
        year[cpf] = entry
        all_data[str(ano)] = year
        _save_all(kv, all_data)


def nova_mensagem_id() -> str:
    return uuid.uuid4().hex[:12]
