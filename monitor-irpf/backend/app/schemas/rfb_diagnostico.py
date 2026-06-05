from pydantic import BaseModel, Field


class RfbDiagnosticoIn(BaseModel):
    cpf: str = Field(..., min_length=11, max_length=20, description="CPF do contribuinte para diagnóstico fiscal.")
    ano_calendario: int = Field(..., ge=2000, le=2100, description="Ano para validar procuração outorgada.")
