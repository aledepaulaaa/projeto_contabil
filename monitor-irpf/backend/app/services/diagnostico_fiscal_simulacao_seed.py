"""Cache de demonstração para a grelha de diagnóstico fiscal (sem chamar InfoSimples)."""

from sqlalchemy.orm import Session

from app.repositories.app_kv_repository import AppKvRepository
from app.services.cliente_service import ClienteService, normalize_cpf_digits
from app.services.diagnostico_fiscal_cache import _load_all, _save_all, _utcnow_iso, label_situacao

_DEMO: list[tuple[str, str]] = [
    ("ANDERSON EUDES", "regular"),
    ("ANA LAURA CAMPOS", "pendencia"),
    ("ARIANE BARRACA", "regular"),
    ("GABRIEL DE PAIVA", "pendencia"),
]


def _demo_resultado(nome: str, situacao: str) -> dict:
    pend_rf: list[str] = []
    if situacao == "pendencia":
        pend_rf = ["Pendência simulada — débito em aberto na Receita Federal (teste)."]
    return {
        "ok": True,
        "infosimples": {
            "code": 200,
            "code_message": "Consulta simulada (ambiente de testes)",
            "data": [
                {
                    "nome": nome,
                    "cpf_cnpj": "",
                    "pendencias_receita_federal": pend_rf,
                    "pendencias_procuradoria_geral": [],
                }
            ],
        },
    }


def aplicar_diagnostico_simulacao(db: Session, ano_calendario: int = 2025) -> int:
    kv = AppKvRepository(db)
    clientes = ClienteService(db).list_carteira_exercicio(ano_calendario)
    all_data = _load_all(kv)
    year_key = str(ano_calendario)
    year = all_data.get(year_key)
    if not isinstance(year, dict):
        year = {}
    alterados = 0
    now = _utcnow_iso()
    for c in clientes:
        nome_upper = (c.nome or "").upper()
        situacao = next((sit for prefix, sit in _DEMO if nome_upper.startswith(prefix)), None)
        if situacao is None:
            continue
        cpf = normalize_cpf_digits(c.cpf_digits or c.cpf_exibicao)
        if not cpf or len(cpf) != 11:
            continue
        resultado = _demo_resultado(c.nome, situacao)
        year[cpf] = {
            "nome": c.nome,
            "situacao": situacao,
            "consultado_em": now,
            "resultado": resultado,
            "historico": [
                {
                    "consultado_em": now,
                    "situacao": situacao,
                    "situacao_label": label_situacao(situacao),
                    "ok": True,
                }
            ],
        }
        alterados += 1
    if alterados:
        all_data[year_key] = year
        _save_all(kv, all_data)
        db.commit()
    return alterados
