-- ══════════════════════════════════════════════════════════
-- V3 — Tabela de Obrigações Tributárias (Rotinas)
-- ══════════════════════════════════════════════════════════

CREATE TABLE obrigacoes (
    id           UUID PRIMARY KEY,
    tenant_id    VARCHAR(100) NOT NULL,
    tipo         VARCHAR(50)  NOT NULL,
    regime       VARCHAR(50)  NOT NULL,
    valor        NUMERIC(15,2) NOT NULL,
    vencimento   DATE NOT NULL,
    status       VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
    competencia  DATE,
    criado_em    TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_obrigacoes_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(tenant_id) ON DELETE CASCADE
);

CREATE INDEX idx_obrigacoes_tenant_id ON obrigacoes(tenant_id);
CREATE INDEX idx_obrigacoes_pendentes ON obrigacoes(tenant_id, status)
    WHERE status = 'PENDENTE';
