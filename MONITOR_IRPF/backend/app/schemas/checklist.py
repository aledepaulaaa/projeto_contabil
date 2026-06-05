from datetime import datetime

from pydantic import BaseModel, Field


class ChecklistItemIn(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=200)
    descricao: str | None = None
    ordem: int = 0
    obrigatorio: bool = True


class ChecklistItemOut(BaseModel):
    id: int
    modelo_id: int
    titulo: str
    descricao: str | None
    ordem: int
    obrigatorio: bool

    model_config = {"from_attributes": True}


class ChecklistModeloCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=120)
    descricao: str | None = None
    itens: list[ChecklistItemIn] = Field(default_factory=list)


class ChecklistModeloUpdate(BaseModel):
    nome: str | None = Field(None, min_length=1, max_length=120)
    descricao: str | None = None
    itens: list[ChecklistItemIn] | None = None


class ChecklistModeloOut(BaseModel):
    id: int
    nome: str
    descricao: str | None
    created_at: datetime
    updated_at: datetime
    itens: list[ChecklistItemOut] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class ChecklistModeloResumoOut(BaseModel):
    id: int
    nome: str
    itens_count: int
