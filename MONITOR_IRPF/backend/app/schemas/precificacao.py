from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

TipoCobrancaPadraoCliente = Literal["padrao", "minimo", "maximo", "bonificado"]


class PersonalizadoEscalonamento(BaseModel):
    """Referências por escalão para «personalizado» (o valor cobrado continua no cadastro do cliente)."""

    fontes_pagamento_1_a_3: Decimal = Field(default=Decimal("0"), ge=0)
    fontes_pagamento_4_a_10: Decimal = Field(default=Decimal("0"), ge=0)
    fontes_pagamento_11_ou_mais: Decimal = Field(default=Decimal("0"), ge=0)
    valor_por_dependente: Decimal = Field(default=Decimal("0"), ge=0)
    investimento_em_acoes: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        description="Referência quando o cliente possui investimento em ações.",
    )
    bens_1_a_5: Decimal = Field(default=Decimal("0"), ge=0)
    bens_6_a_10: Decimal = Field(default=Decimal("0"), ge=0)
    bens_11_ou_mais: Decimal = Field(default=Decimal("0"), ge=0)


class PrecificacaoParametrosOut(BaseModel):
    """Valores de referência (honorários) usados conforme o tipo escolhido no cliente."""

    valor_padrao: Decimal = Field(description="Valor quando o cliente usa «valor padrão».")
    valor_minimo: Decimal
    valor_maximo: Decimal
    valor_personalizado_referencia: Decimal = Field(
        default=Decimal("0"),
        description="Referência geral para «personalizado»; o montante cobrado vem do cadastro do cliente.",
    )
    personalizado_escalonamento: PersonalizadoEscalonamento = Field(
        default_factory=PersonalizadoEscalonamento,
        description="Referências por faixas de fontes de pagamento, dependentes, ações e bens.",
    )
    valor_bonificado: Decimal = Field(description="Referência para «bonificado» (ex.: zero).")
    tipo_cobranca_padrao: TipoCobrancaPadraoCliente = Field(
        default="padrao",
        description="Tipo aplicado a clientes criados por sinc./import. IRPF e pré-selecionado no novo cadastro manual.",
    )


class PrecificacaoParametrosUpdate(BaseModel):
    valor_padrao: Decimal = Field(ge=0)
    valor_minimo: Decimal = Field(ge=0)
    valor_maximo: Decimal = Field(ge=0)
    valor_personalizado_referencia: Decimal = Field(default=Decimal("0"), ge=0)
    personalizado_escalonamento: PersonalizadoEscalonamento = Field(default_factory=PersonalizadoEscalonamento)
    valor_bonificado: Decimal = Field(ge=0)
    tipo_cobranca_padrao: TipoCobrancaPadraoCliente = "padrao"
