"""Ajustes leves de schema em SQLite (sem Alembic) para bases já existentes."""

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

_DEFAULT_ANO_CARTEIRA = 2024


def ensure_sqlite_schema(engine: Engine) -> None:
    if not str(engine.url).startswith("sqlite"):
        return
    insp = inspect(engine)
    if "clientes_manuais" in insp.get_table_names():
        cols = {c["name"] for c in insp.get_columns("clientes_manuais")}
        with engine.begin() as conn:
            if "ativo" not in cols:
                conn.execute(
                    text("ALTER TABLE clientes_manuais ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT 1"),
                )
            if "ano_carteira" not in cols:
                conn.execute(
                    text(
                        f"ALTER TABLE clientes_manuais ADD COLUMN ano_carteira INTEGER NOT NULL DEFAULT {_DEFAULT_ANO_CARTEIRA}",
                    ),
                )
            if "origem_cadastro" not in cols:
                conn.execute(
                    text(
                        "ALTER TABLE clientes_manuais ADD COLUMN origem_cadastro VARCHAR(32) NOT NULL DEFAULT 'manual'",
                    ),
                )
            if "tipo_precificacao" not in cols:
                conn.execute(
                    text(
                        "ALTER TABLE clientes_manuais ADD COLUMN tipo_precificacao VARCHAR(24) NOT NULL DEFAULT 'padrao'",
                    ),
                )
            if "valor_personalizado" not in cols:
                conn.execute(text("ALTER TABLE clientes_manuais ADD COLUMN valor_personalizado NUMERIC(14, 2)"))
            if "asaas_customer_id" not in cols:
                conn.execute(text("ALTER TABLE clientes_manuais ADD COLUMN asaas_customer_id VARCHAR(64)"))

    if "declaracoes" in insp.get_table_names():
        dcols = {c["name"] for c in insp.get_columns("declaracoes")}
        with engine.begin() as conn:
            if "rendimentos_tributaveis_total" not in dcols:
                conn.execute(text("ALTER TABLE declaracoes ADD COLUMN rendimentos_tributaveis_total NUMERIC(14, 2)"))
            if "rendimentos_isentos_total" not in dcols:
                conn.execute(text("ALTER TABLE declaracoes ADD COLUMN rendimentos_isentos_total NUMERIC(14, 2)"))
            if "patrimonio_liquido_declarado" not in dcols:
                conn.execute(text("ALTER TABLE declaracoes ADD COLUMN patrimonio_liquido_declarado NUMERIC(16, 2)"))
            if "imposto_quantidade_parcelas" not in dcols:
                conn.execute(text("ALTER TABLE declaracoes ADD COLUMN imposto_quantidade_parcelas INTEGER"))
            if "imposto_debito_automatico" not in dcols:
                conn.execute(text("ALTER TABLE declaracoes ADD COLUMN imposto_debito_automatico BOOLEAN"))
            if "malha_motivo_rfb" not in dcols:
                conn.execute(text("ALTER TABLE declaracoes ADD COLUMN malha_motivo_rfb TEXT"))
            if "malha_consultado_em" not in dcols:
                conn.execute(text("ALTER TABLE declaracoes ADD COLUMN malha_consultado_em DATETIME"))
            if "malha_fonte_consulta" not in dcols:
                conn.execute(text("ALTER TABLE declaracoes ADD COLUMN malha_fonte_consulta VARCHAR(16)"))
            if "restituicao_status" not in dcols:
                conn.execute(text("ALTER TABLE declaracoes ADD COLUMN restituicao_status VARCHAR(24)"))
            if "restituicao_erro_motivo" not in dcols:
                conn.execute(text("ALTER TABLE declaracoes ADD COLUMN restituicao_erro_motivo TEXT"))
            if "restituicao_observacao" not in dcols:
                conn.execute(text("ALTER TABLE declaracoes ADD COLUMN restituicao_observacao TEXT"))
            if "restituicao_consultado_em" not in dcols:
                conn.execute(text("ALTER TABLE declaracoes ADD COLUMN restituicao_consultado_em DATETIME"))
            if "restituicao_fonte_consulta" not in dcols:
                conn.execute(text("ALTER TABLE declaracoes ADD COLUMN restituicao_fonte_consulta VARCHAR(16)"))

    if "cliente_documentacoes" in insp.get_table_names():
        ccols = {c["name"] for c in insp.get_columns("cliente_documentacoes")}
        with engine.begin() as conn:
            if "portal_bloqueado" not in ccols:
                conn.execute(
                    text(
                        "ALTER TABLE cliente_documentacoes ADD COLUMN portal_bloqueado BOOLEAN NOT NULL DEFAULT 0",
                    ),
                )
