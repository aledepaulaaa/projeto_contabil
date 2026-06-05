from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, engine
from app.database_migrate import ensure_sqlite_schema
from app.routers import (
    checklist_modelos,
    clientes,
    darf,
    declaracoes,
    diagnostico_fiscal,
    documentos,
    documentos_public,
    mensagens_ecac,
    insights,
    integracoes,
    malha,
    monitor,
    precificacao,
    procuracoes,
    restituicoes,
    sync,
    usuarios,
)


@asynccontextmanager
async def _lifespan(_app: FastAPI):
    # Importa modelos para registar metadados antes do create_all
    from app.models import (  # noqa: F401
        app_kv,
        checklist,
        cliente_carteira_estado,
        cliente_manual,
        cobranca,
        declaracao,
        procuracao,
        usuario,
    )

    Base.metadata.create_all(bind=engine)
    ensure_sqlite_schema(engine)
    from app.database import SessionLocal
    from app.services.darf_simulacao_seed import aplicar_perfis_darf_simulacao
    from app.services.malha_simulacao_seed import aplicar_malha_simulacao
    from app.services.diagnostico_fiscal_simulacao_seed import aplicar_diagnostico_simulacao
    from app.services.mensagens_ecac_simulacao_seed import aplicar_mensagens_ecac_simulacao
    from app.services.restituicao_simulacao_seed import aplicar_restituicao_simulacao
    from app.services.checklist_seed import ensure_checklist_padrao

    db = SessionLocal()
    try:
        ensure_checklist_padrao(db)
        db.commit()
        aplicar_perfis_darf_simulacao(db, ano_calendario=2025)
        aplicar_malha_simulacao(db, ano_calendario=2025)
        aplicar_restituicao_simulacao(db, ano_calendario=2025)
        aplicar_diagnostico_simulacao(db, ano_calendario=2025)
        aplicar_mensagens_ecac_simulacao(db, ano_calendario=2025)
    finally:
        db.close()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Carteira IRPF API", version="0.1.0-rebuild", lifespan=_lifespan)

    origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    api = APIRouter(prefix="/api")
    api.include_router(sync.router)
    api.include_router(monitor.router)
    api.include_router(declaracoes.router)
    api.include_router(darf.router)
    api.include_router(malha.router)
    api.include_router(restituicoes.router)
    api.include_router(diagnostico_fiscal.router)
    api.include_router(mensagens_ecac.router)
    api.include_router(clientes.router)
    api.include_router(procuracoes.router)
    api.include_router(precificacao.router)
    api.include_router(usuarios.router)
    api.include_router(insights.router)
    api.include_router(integracoes.router)
    api.include_router(checklist_modelos.router)
    api.include_router(documentos.router)
    api.include_router(documentos_public.router)
    app.include_router(api)

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
