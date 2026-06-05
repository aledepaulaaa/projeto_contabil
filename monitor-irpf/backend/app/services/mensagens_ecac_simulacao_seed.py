"""Mensagens e-CAC de demonstração — fase de testes."""

from sqlalchemy.orm import Session

from app.repositories.app_kv_repository import AppKvRepository
from app.services.cliente_service import ClienteService, normalize_cpf_digits
from app.services.mensagens_ecac_cache import _load_all, _save_all, _utcnow_iso, nova_mensagem_id

# prefixo nome → não lidas (0 = todas lidas)
_DEMO: list[tuple[str, int]] = [
    ("ANDERSON EUDES", 0),
    ("ANA LAURA CAMPOS", 11),
    ("ARIANE BARRACA", 4),
    ("GABRIEL DE PAIVA", 2),
    ("FERNANDA FERNANDES", 0),
]


def _gerar_mensagens(nome: str, nao_lidas: int) -> list[dict]:
    total = max(nao_lidas, 3) if nao_lidas > 0 else 2
    msgs = []
    for i in range(total):
        lida = i >= nao_lidas
        msgs.append(
            {
                "id": nova_mensagem_id(),
                "assunto": f"Comunicado e-CAC #{i + 1} — {nome.split()[0]}",
                "data": f"2026-0{min(6, 1 + i)}-{10 + i:02d}",
                "lida": lida,
                "corpo_resumo": (
                    "Mensagem simulada da caixa de mensagens do e-CAC. "
                    + ("Pendente de leitura." if not lida else "Já lida pelo contribuinte.")
                ),
            }
        )
    return msgs


def aplicar_mensagens_ecac_simulacao(db: Session, ano_calendario: int = 2025) -> int:
    kv = AppKvRepository(db)
    all_data = _load_all(kv)
    year_key = str(ano_calendario)
    year = all_data.get(year_key)
    if not isinstance(year, dict):
        year = {}
    now = _utcnow_iso()
    alterados = 0
    for c in ClienteService(db).list_carteira_exercicio(ano_calendario):
        nome_upper = (c.nome or "").upper()
        nao_lidas = next((n for prefix, n in _DEMO if nome_upper.startswith(prefix)), None)
        if nao_lidas is None:
            continue
        cpf = normalize_cpf_digits(c.cpf_digits or c.cpf_exibicao)
        if not cpf or len(cpf) != 11:
            continue
        mensagens = _gerar_mensagens(c.nome, nao_lidas)
        year[cpf] = {
            "nome": c.nome,
            "mensagens": mensagens,
            "total_mensagens": len(mensagens),
            "nao_lidas": nao_lidas,
            "consultado_em": now,
        }
        alterados += 1
    if alterados:
        all_data[year_key] = year
        _save_all(kv, all_data)
        db.commit()
    return alterados
