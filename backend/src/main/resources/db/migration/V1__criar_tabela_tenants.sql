-- ══════════════════════════════════════════════════════════
-- V1 — Tabela de Tenants (Escritórios Contábeis)
-- ══════════════════════════════════════════════════════════

CREATE TABLE tenants (
    id          UUID PRIMARY KEY,
    tenant_id   VARCHAR(100) NOT NULL UNIQUE,
    nome_escritorio VARCHAR(255) NOT NULL,
    plano       VARCHAR(50) NOT NULL DEFAULT 'BASICO',
    status      VARCHAR(50) NOT NULL DEFAULT 'ATIVO',
    criado_em   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_tenant_id ON tenants(tenant_id);
