-- ══════════════════════════════════════════════════════════
-- V7 — Tabela de Conexões Externas (Google Ads, etc)
-- ══════════════════════════════════════════════════════════

CREATE TABLE crm_external_connections (
    id                      UUID PRIMARY KEY,
    empresa_locataria_id    VARCHAR(100) NOT NULL,
    provider                VARCHAR(50) NOT NULL,
    access_token            TEXT,
    refresh_token           TEXT,
    expires_at             TIMESTAMP,
    google_customer_id     VARCHAR(50),
    status                  VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    last_sync               TIMESTAMP,
    criado_em               TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_external_connections_tenant ON crm_external_connections(empresa_locataria_id);
CREATE INDEX idx_external_connections_provider ON crm_external_connections(provider);

-- ══════════════════════════════════════════════════════════
-- Auditoria Envers
-- ══════════════════════════════════════════════════════════

CREATE TABLE crm_external_connections_aud (
    id                      UUID NOT NULL,
    rev                     INTEGER NOT NULL,
    revtype                 SMALLINT,
    empresa_locataria_id    VARCHAR(100),
    provider                VARCHAR(50),
    access_token            TEXT,
    refresh_token           TEXT,
    expires_at             TIMESTAMP,
    google_customer_id     VARCHAR(50),
    status                  VARCHAR(50),
    last_sync               TIMESTAMP,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_external_connections_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);
