-- ══════════════════════════════════════════════════════════
-- V12 — Tabela de Auditoria Centralizada (Atividades)
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS auditoria_atividades (
    id                      UUID PRIMARY KEY,
    empresa_locataria_id    VARCHAR(100) NOT NULL,
    usuario                 VARCHAR(150),
    tipo                    VARCHAR(50) NOT NULL, -- LEAD_CRIADO, LEAD_MOVIDO, LEAD_EXCLUIDO, etc.
    descricao               TEXT NOT NULL,
    metadata                TEXT, -- JSON para dados extras
    criado_em              TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_tenant_id ON auditoria_atividades(empresa_locataria_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_criado_em ON auditoria_atividades(criado_em DESC);
