from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class CarteiraDeclaracaoSituacaoRow(BaseModel):
    """Cliente da carteira com situação derivada das declarações do exercício."""

    estado_key: str
    nome: str
    cpf_exibicao: str | None = None
    manual_id: int
    ativo: bool = True
    situacao_declaracao: Literal["nao_existe", "valido_ate", "vencida"]
    validade_ate: date | None = Field(
        default=None,
        description="Data até a qual a situação «válido até» se aplica (prazo de entrega ou referência pós-entrega).",
    )
