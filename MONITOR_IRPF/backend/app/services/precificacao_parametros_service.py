import json
from decimal import Decimal
from typing import cast

from sqlalchemy.orm import Session

from app.repositories.app_kv_repository import AppKvRepository
from app.schemas.precificacao import (
    PersonalizadoEscalonamento,
    PrecificacaoParametrosOut,
    PrecificacaoParametrosUpdate,
    TipoCobrancaPadraoCliente,
)

KV_KEY = "precificacao_parametros_v1"

_TIPOS_AUTO = frozenset({"padrao", "minimo", "maximo", "bonificado"})


def _d(v: object) -> Decimal:
    return Decimal(str(v))


def _normaliza_tipo_padrao(raw: object) -> TipoCobrancaPadraoCliente:
    t = str(raw or "padrao").strip().lower()
    if t in _TIPOS_AUTO:
        return cast(TipoCobrancaPadraoCliente, t)
    return "padrao"


def _default_escalonamento() -> PersonalizadoEscalonamento:
    return PersonalizadoEscalonamento()


def _parse_escalonamento(raw: object) -> PersonalizadoEscalonamento:
    if not isinstance(raw, dict):
        return _default_escalonamento()
    x = raw
    return PersonalizadoEscalonamento(
        fontes_pagamento_1_a_3=_d(x.get("fontes_pagamento_1_a_3", 0)),
        fontes_pagamento_4_a_10=_d(x.get("fontes_pagamento_4_a_10", 0)),
        fontes_pagamento_11_ou_mais=_d(x.get("fontes_pagamento_11_ou_mais", 0)),
        valor_por_dependente=_d(x.get("valor_por_dependente", 0)),
        investimento_em_acoes=_d(x.get("investimento_em_acoes", 0)),
        bens_1_a_5=_d(x.get("bens_1_a_5", 0)),
        bens_6_a_10=_d(x.get("bens_6_a_10", 0)),
        bens_11_ou_mais=_d(x.get("bens_11_ou_mais", 0)),
    )


def _escalonamento_blob(e: PersonalizadoEscalonamento) -> dict[str, str]:
    return {k: str(v) for k, v in e.model_dump().items()}


class PrecificacaoParametrosService:
    def __init__(self, db: Session) -> None:
        self._kv = AppKvRepository(db)

    def get(self) -> PrecificacaoParametrosOut:
        raw = self._kv.get(KV_KEY)
        if not raw or not raw.strip():
            return PrecificacaoParametrosOut(
                valor_padrao=Decimal("0"),
                valor_minimo=Decimal("0"),
                valor_maximo=Decimal("0"),
                valor_personalizado_referencia=Decimal("0"),
                personalizado_escalonamento=_default_escalonamento(),
                valor_bonificado=Decimal("0"),
                tipo_cobranca_padrao="padrao",
            )
        try:
            d = json.loads(raw)
        except json.JSONDecodeError:
            return PrecificacaoParametrosOut(
                valor_padrao=Decimal("0"),
                valor_minimo=Decimal("0"),
                valor_maximo=Decimal("0"),
                valor_personalizado_referencia=Decimal("0"),
                personalizado_escalonamento=_default_escalonamento(),
                valor_bonificado=Decimal("0"),
                tipo_cobranca_padrao="padrao",
            )
        tp = _normaliza_tipo_padrao(d.get("tipo_cobranca_padrao", "padrao"))
        return PrecificacaoParametrosOut(
            valor_padrao=_d(d.get("valor_padrao", 0)),
            valor_minimo=_d(d.get("valor_minimo", 0)),
            valor_maximo=_d(d.get("valor_maximo", 0)),
            valor_personalizado_referencia=_d(d.get("valor_personalizado_referencia", 0)),
            personalizado_escalonamento=_parse_escalonamento(d.get("personalizado_escalonamento")),
            valor_bonificado=_d(d.get("valor_bonificado", 0)),
            tipo_cobranca_padrao=tp,
        )

    def save(self, payload: PrecificacaoParametrosUpdate) -> PrecificacaoParametrosOut:
        out = PrecificacaoParametrosOut(
            valor_padrao=payload.valor_padrao,
            valor_minimo=payload.valor_minimo,
            valor_maximo=payload.valor_maximo,
            valor_personalizado_referencia=payload.valor_personalizado_referencia,
            personalizado_escalonamento=payload.personalizado_escalonamento,
            valor_bonificado=payload.valor_bonificado,
            tipo_cobranca_padrao=payload.tipo_cobranca_padrao,
        )
        blob = json.dumps(
            {
                "valor_padrao": str(out.valor_padrao),
                "valor_minimo": str(out.valor_minimo),
                "valor_maximo": str(out.valor_maximo),
                "valor_personalizado_referencia": str(out.valor_personalizado_referencia),
                "personalizado_escalonamento": _escalonamento_blob(out.personalizado_escalonamento),
                "valor_bonificado": str(out.valor_bonificado),
                "tipo_cobranca_padrao": out.tipo_cobranca_padrao,
            },
        )
        self._kv.upsert(KV_KEY, blob)
        return out
