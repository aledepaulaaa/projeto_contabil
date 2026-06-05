from pydantic import BaseModel, Field


class AsaasCobrancaClienteIn(BaseModel):
    """Gera cobrança Asaas para um cliente da carteira (honorário já calculado)."""

    estado_key: str = Field(..., min_length=8, description="Formato manual:{id}.")
    ano_carteira: int = Field(..., ge=2000, le=2100, description="Exercício da carteira (ano-calendário IRPF).")
