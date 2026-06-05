"""Perfis de demonstração DARF (parcelas e débito automático) — fase de simulação."""

from sqlalchemy.orm import Session

from app.models.declaracao import Declaracao

# prefixo do nome (maiúsculas) → (parcelas, débito automático)
_DEMO_PERFIS: list[tuple[str, int, bool]] = [
    ("ANA FLAVIA OLIVEIRA", 3, False),
    ("ANA LUIZA DE OLIVEIRA", 6, True),
    ("ARENALDO JOSE DE OLIVEIRA", 2, True),
    ("BRENDA ANACLETO DE MIRANDA", 4, False),
    ("DANIEL LUIZ DE OLIVEIRA", 5, False),
    ("DIEGO MARTINS DE SOUSA", 8, True),
    ("EMANUELLA ROBERTA HESPANHOL", 2, False),
    ("FELIPE AUGUSTO ARAUJO", 3, True),
    ("ISADORA VALERIANO", 6, False),
]


def aplicar_perfis_darf_simulacao(db: Session, ano_calendario: int = 2025) -> int:
    """Atualiza declarações de imposto a pagar com perfis variados para testes na tela DARF."""
    rows = (
        db.query(Declaracao)
        .filter(
            Declaracao.ano_calendario == ano_calendario,
            Declaracao.resultado_fiscal == "imposto_pagar",
        )
        .all()
    )
    alterados = 0
    for row in rows:
        nome = (row.titular_nome or "").upper()
        perfil = next(
            ((parcelas, debito) for prefix, parcelas, debito in _DEMO_PERFIS if nome.startswith(prefix)),
            None,
        )
        if perfil is None:
            continue
        parcelas, debito = perfil
        if row.imposto_quantidade_parcelas != parcelas or row.imposto_debito_automatico != debito:
            row.imposto_quantidade_parcelas = parcelas
            row.imposto_debito_automatico = debito
            alterados += 1
    if alterados:
        db.commit()
    return alterados
