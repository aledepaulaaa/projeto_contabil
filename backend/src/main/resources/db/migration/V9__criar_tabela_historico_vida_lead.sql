-- ══════════════════════════════════════════════════════════
-- V9 — Tabela de Histórico de Vida do Lead (Timeline)
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS historico_vida_lead (
    id                      UUID PRIMARY KEY,
    lead_id                UUID NOT NULL,
    empresa_locataria_id    VARCHAR(100) NOT NULL,
    eventos                TEXT NOT NULL, -- JSON serializado via JPA Adapter
    criado_em              TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historico_lead_id ON historico_vida_lead(lead_id);
CREATE INDEX IF NOT EXISTS idx_historico_tenant_id ON historico_vida_lead(empresa_locataria_id);

-- Auditoria Envers
CREATE TABLE IF NOT EXISTS historico_vida_lead_aud (
    id                      UUID NOT NULL,
    rev                     INTEGER NOT NULL,
    revtype                 SMALLINT,
    lead_id                UUID,
    empresa_locataria_id    VARCHAR(100),
    eventos                TEXT,
    criado_em              TIMESTAMP,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_historico_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);
