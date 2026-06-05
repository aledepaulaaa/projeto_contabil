-- ══════════════════════════════════════════════════════════
-- V1 — Tabela de Tenants (agora como empresas_locatarias) e Base de Auditoria
-- ══════════════════════════════════════════════════════════

CREATE TABLE revinfo (
    rev         INTEGER NOT NULL,
    revtstmp    BIGINT,
    PRIMARY KEY (rev)
);

CREATE SEQUENCE revinfo_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE empresas_locatarias (
    id          UUID PRIMARY KEY,
    empresa_locataria_id   VARCHAR(100) NOT NULL UNIQUE,
    nome_escritorio VARCHAR(255) NOT NULL,
    plano       VARCHAR(50) NOT NULL DEFAULT 'BASICO',
    status      VARCHAR(50) NOT NULL DEFAULT 'ATIVO',
    criado_em   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_empresas_id ON empresas_locatarias(empresa_locataria_id);

-- Auditoria
CREATE TABLE empresas_locatarias_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    empresa_locataria_id VARCHAR(100),
    nome_escritorio VARCHAR(255),
    plano VARCHAR(50),
    status VARCHAR(50),
    criado_em TIMESTAMP,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_empresas_locatarias_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);
