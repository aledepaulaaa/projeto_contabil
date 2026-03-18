-- ══════════════════════════════════════════════════════════
-- V4 — Tabelas de Alvarás e Processos
-- ══════════════════════════════════════════════════════════

CREATE TABLE alvaras (
    id             UUID PRIMARY KEY,
    tenant_id      VARCHAR(100) NOT NULL,
    tipo           VARCHAR(100) NOT NULL,
    descricao      TEXT,
    orgao_emissor  VARCHAR(255),
    numero_alvara  VARCHAR(100),
    data_emissao   DATE,
    data_validade  DATE NOT NULL,
    status         VARCHAR(50) NOT NULL DEFAULT 'VIGENTE',
    criado_em      TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_alvaras_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(tenant_id) ON DELETE CASCADE
);

CREATE INDEX idx_alvaras_tenant_id ON alvaras(tenant_id);
CREATE INDEX idx_alvaras_vencidos ON alvaras(tenant_id, status, data_validade)
    WHERE status = 'VIGENTE';

-- ──────────────────────────────────────────────────────────

CREATE TABLE processos (
    id              UUID PRIMARY KEY,
    tenant_id       VARCHAR(100) NOT NULL,
    alvara_id       UUID NOT NULL,
    descricao       VARCHAR(500) NOT NULL,
    status          VARCHAR(50) NOT NULL DEFAULT 'ABERTO',
    prazo_estimado  DATE,
    observacoes     TEXT,
    criado_em       TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_processos_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    CONSTRAINT fk_processos_alvara FOREIGN KEY (alvara_id)
        REFERENCES alvaras(id) ON DELETE CASCADE
);

CREATE INDEX idx_processos_tenant_id ON processos(tenant_id);
CREATE INDEX idx_processos_alvara_id ON processos(alvara_id);
