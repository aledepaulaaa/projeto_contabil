"""Cálculo do valor de honorário por cliente (espelha a lógica do frontend)."""

from decimal import Decimal

from app.models.cliente_manual import (
    TIPO_PRECIFICACAO_BONIFICADO,
    TIPO_PRECIFICACAO_MAXIMO,
    TIPO_PRECIFICACAO_MINIMO,
    TIPO_PRECIFICACAO_PADRAO,
    TIPO_PRECIFICACAO_PERSONALIZADO,
    ClienteManual,
)
from app.schemas.precificacao import PrecificacaoParametrosOut


def valor_honorario_cliente_manual(m: ClienteManual, p: PrecificacaoParametrosOut) -> Decimal | None:
    tipo = (m.tipo_precificacao or TIPO_PRECIFICACAO_PADRAO).strip().lower()
    if tipo == TIPO_PRECIFICACAO_PERSONALIZADO:
        if m.valor_personalizado is None:
            return None
        return Decimal(m.valor_personalizado)
    if tipo == TIPO_PRECIFICACAO_PADRAO:
        return p.valor_padrao
    if tipo == TIPO_PRECIFICACAO_MINIMO:
        return p.valor_minimo
    if tipo == TIPO_PRECIFICACAO_MAXIMO:
        return p.valor_maximo
    if tipo == TIPO_PRECIFICACAO_BONIFICADO:
        return p.valor_bonificado
    return p.valor_padrao
