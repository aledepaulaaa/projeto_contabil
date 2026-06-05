-- ══════════════════════════════════════════════════════════
-- V2 — Tabela de Leads (CRM)
-- ══════════════════════════════════════════════════════════

CREATE TABLE leads (
    id            UUID PRIMARY KEY,
    empresa_locataria_id     VARCHAR(100) NOT NULL,
    nome_contato  VARCHAR(255) NOT NULL,
    email         VARCHAR(255),
    telefone      VARCHAR(20),
    cnpj          VARCHAR(14),
    nome_empresa  VARCHAR(255) NOT NULL,
    status        VARCHAR(50) NOT NULL DEFAULT 'NOVO',
    origem_lead   VARCHAR(50),
    tipo_servico  VARCHAR(50),
    criado_em     TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_leads_empresa FOREIGN KEY (empresa_locataria_id)
        REFERENCES empresas_locatarias(empresa_locataria_id) ON DELETE CASCADE
);

CREATE INDEX idx_leads_empresa_id ON leads(empresa_locataria_id);
CREATE UNIQUE INDEX idx_leads_cnpj_empresa ON leads(cnpj, empresa_locataria_id)
    WHERE cnpj IS NOT NULL;

-- Auditoria
CREATE TABLE leads_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    empresa_locataria_id VARCHAR(100),
    nome_contato VARCHAR(255),
    email VARCHAR(255),
    telefone VARCHAR(20),
    cnpj VARCHAR(14),
    nome_empresa VARCHAR(255),
    status VARCHAR(50),
    origem_lead VARCHAR(50),
    tipo_servico VARCHAR(50),
    criado_em TIMESTAMP,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_leads_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);
