from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.declaracao import Declaracao
from app.repositories.declaracao_repository import DeclaracaoRepository
from app.schemas.declaracao import DeclaracaoCreate, DeclaracaoUpdate, DashboardResumoOut


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class DeclaracaoService:
    def __init__(self, db: Session) -> None:
        self._db = db
        self._repo = DeclaracaoRepository(db)

    def list_declaracoes(
        self,
        status: str | None,
        ano: int | None,
        usuario_responsavel_id: int | None = None,
        status_processamento_rfb: str | None = None,
    ):
        return self._repo.list_all(
            status,
            ano,
            usuario_responsavel_id,
            status_processamento_rfb,
        )

    def get(self, declaracao_id: int) -> Declaracao | None:
        return self._repo.get(declaracao_id)

    def dashboard_resumo(
        self,
        status: str | None,
        ano: int | None,
        usuario_responsavel_id: int | None = None,
        status_processamento_rfb: str | None = None,
    ) -> DashboardResumoOut:
        por_status = {
            k: v
            for k, v in self._repo.por_status_counts(
                status,
                ano,
                usuario_responsavel_id,
                status_processamento_rfb,
            )
        }
        por_resultado_raw = dict(
            self._repo.por_resultado_counts(
                status,
                ano,
                usuario_responsavel_id,
                status_processamento_rfb,
            ),
        )
        por_resultado = {(k if k is not None else "nao_informado"): v for k, v in por_resultado_raw.items()}
        por_ano = [
            {"ano_calendario": str(a), "quantidade": c}
            for a, c in self._repo.por_ano_counts(
                status,
                ano,
                usuario_responsavel_id,
                status_processamento_rfb,
            )
        ]
        return DashboardResumoOut(por_status=por_status, por_resultado=por_resultado, por_ano=por_ano)

    def create(self, payload: DeclaracaoCreate) -> Declaracao:
        now = _utcnow()
        row = Declaracao(
            **payload.model_dump(),
            created_at=now,
            updated_at=now,
        )
        self._repo.add(row)
        return row

    def update(self, row: Declaracao, payload: DeclaracaoUpdate) -> Declaracao:
        data = payload.model_dump(exclude_unset=True)
        for k, v in data.items():
            setattr(row, k, v)
        row.updated_at = _utcnow()
        return row

    def delete(self, row: Declaracao) -> None:
        self._repo.delete(row)
