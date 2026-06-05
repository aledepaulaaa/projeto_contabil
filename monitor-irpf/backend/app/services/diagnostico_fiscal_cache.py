import json
from datetime import datetime, timezone
from typing import Any

from app.repositories.app_kv_repository import AppKvRepository

_K_CACHE = "diagnostico_fiscal_cache_v1"

_SITUACAO_LABEL = {
    "regular": "Regular",
    "pendencia": "Pendência",
    "erro": "Erro na consulta",
    "nao_consultado": "Não consultado",
}


def label_situacao(codigo: str) -> str:
    return _SITUACAO_LABEL.get(codigo, codigo)


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).replace(tzinfo=None).isoformat()


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
    all_data = _load_all(kv)
    year = all_data.get(str(ano))
    return year if isinstance(year, dict) else {}


def get_entrada(kv: AppKvRepository, ano: int, cpf: str) -> dict[str, Any] | None:
    year = get_ano_cache(kv, ano)
    entry = year.get(cpf)
    return entry if isinstance(entry, dict) else None


def set_entrada(
    kv: AppKvRepository,
    ano: int,
    cpf: str,
    *,
    nome: str,
    situacao: str,
    resultado: dict[str, Any] | None,
) -> None:
    all_data = _load_all(kv)
    year_key = str(ano)
    year = all_data.get(year_key)
    if not isinstance(year, dict):
        year = {}
    historico: list[dict[str, Any]] = []
    prev = year.get(cpf)
    if isinstance(prev, dict) and isinstance(prev.get("historico"), list):
        historico = list(prev["historico"][-19:])
    if resultado is not None:
        historico.append(
            {
                "consultado_em": _utcnow_iso(),
                "situacao": situacao,
                "situacao_label": label_situacao(situacao),
                "ok": resultado.get("ok"),
            }
        )
    year[cpf] = {
        "nome": nome,
        "situacao": situacao,
        "consultado_em": _utcnow_iso(),
        "resultado": resultado,
        "historico": historico,
    }
    all_data[year_key] = year
    _save_all(kv, all_data)


def extrair_situacao(resultado: dict[str, Any] | None) -> str:
    if not resultado:
        return "nao_consultado"
    if resultado.get("ok") is False:
        return "erro"
    infos = resultado.get("infosimples")
    if not isinstance(infos, dict):
        return "erro"
    data = infos.get("data")
    if not isinstance(data, list) or not data:
        code = infos.get("code")
        if code == 200:
            return "regular"
        return "erro"
    bloco = data[0] if isinstance(data[0], dict) else {}
    pend_rf = bloco.get("pendencias_receita_federal")
    pend_pg = bloco.get("pendencias_procuradoria_geral")
    tem_pend = False
    if isinstance(pend_rf, list) and len(pend_rf) > 0:
        tem_pend = True
    if isinstance(pend_pg, list) and len(pend_pg) > 0:
        tem_pend = True
    return "pendencia" if tem_pend else "regular"
