from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    email: str
    ativo: bool
    created_at: datetime
    updated_at: datetime


class UsuarioCreate(BaseModel):
    nome: str
    email: str
    ativo: bool = True
