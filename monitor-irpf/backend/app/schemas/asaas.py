from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

AsaasBillingType = Literal["UNDEFINED", "BOLETO", "CREDIT_CARD", "PIX"]


class AsaasPaymentCreateRequest(BaseModel):
    """Corpo alinhado ao PaymentSaveRequestDTO da API Asaas (cobrança avulsa, parcela única)."""

    model_config = ConfigDict(populate_by_name=True)

    customer: str = Field(..., min_length=1, description="ID do cliente no Asaas (cus_…)")
    billing_type: AsaasBillingType = Field(..., alias="billingType")
    value: Decimal = Field(..., gt=0, description="Valor da cobrança")
    due_date: str = Field(..., alias="dueDate", description="YYYY-MM-DD")
    description: str | None = Field(None, max_length=500)
    external_reference: str | None = Field(None, alias="externalReference", max_length=200)

    @field_validator("due_date")
    @classmethod
    def due_date_iso(cls, v: str) -> str:
        parts = v.strip().split("-")
        if len(parts) != 3 or any(not p.isdigit() for p in parts):
            raise ValueError("dueDate deve estar no formato YYYY-MM-DD")
        return v.strip()

