-- ══════════════════════════════════════════════════════════
-- V2 — Tabela de Leads (CRM)
-- ══════════════════════════════════════════════════════════

CREATE TABLE leads (
    id            UUID PRIMARY KEY,
    tenant_id     VARCHAR(100) NOT NULL,
    nome_contato  VARCHAR(255) NOT NULL,
    email         VARCHAR(255),
    telefone      VARCHAR(20),
    cnpj          VARCHAR(14),
    nome_empresa  VARCHAR(255) NOT NULL,
    status        VARCHAR(50) NOT NULL DEFAULT 'NOVO',
    criado_em     TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_leads_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(tenant_id) ON DELETE CASCADE
);

CREATE INDEX idx_leads_tenant_id ON leads(tenant_id);
CREATE UNIQUE INDEX idx_leads_cnpj_tenant ON leads(cnpj, tenant_id)
    WHERE cnpj IS NOT NULL;
