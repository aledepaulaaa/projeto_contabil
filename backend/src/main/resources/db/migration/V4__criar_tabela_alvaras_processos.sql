-- ══════════════════════════════════════════════════════════
-- V4 — Tabelas de Alvarás e Processos
-- ══════════════════════════════════════════════════════════

CREATE TABLE alvaras (
    id             UUID PRIMARY KEY,
    empresa_locataria_id      VARCHAR(100) NOT NULL,
    tipo           VARCHAR(100) NOT NULL,
    descricao      TEXT,
    orgao_emissor  VARCHAR(255),
    numero_alvara  VARCHAR(100),
    data_emissao   DATE,
    data_validade  DATE NOT NULL,
    status         VARCHAR(50) NOT NULL DEFAULT 'VIGENTE',
    criado_em      TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_alvaras_empresa FOREIGN KEY (empresa_locataria_id)
        REFERENCES empresas_locatarias(empresa_locataria_id) ON DELETE CASCADE
);

CREATE INDEX idx_alvaras_empresa_id ON alvaras(empresa_locataria_id);
CREATE INDEX idx_alvaras_vencidos ON alvaras(empresa_locataria_id, status, data_validade)
    WHERE status = 'VIGENTE';

-- ──────────────────────────────────────────────────────────

CREATE TABLE processos (
    id              UUID PRIMARY KEY,
    empresa_locataria_id       VARCHAR(100) NOT NULL,
    alvara_id       UUID NOT NULL,
    descricao       VARCHAR(500) NOT NULL,
    status          VARCHAR(50) NOT NULL DEFAULT 'ABERTO',
    prazo_estimado  DATE,
    observacoes     TEXT,
    criado_em       TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_processos_empresa FOREIGN KEY (empresa_locataria_id)
        REFERENCES empresas_locatarias(empresa_locataria_id) ON DELETE CASCADE,
    CONSTRAINT fk_processos_alvara FOREIGN KEY (alvara_id)
        REFERENCES alvaras(id) ON DELETE CASCADE
);

CREATE INDEX idx_processos_empresa_id ON processos(empresa_locataria_id);
CREATE INDEX idx_processos_alvara_id ON processos(alvara_id);

-- Auditoria Alvarás
CREATE TABLE alvaras_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    empresa_locataria_id VARCHAR(100),
    tipo VARCHAR(100),
    descricao TEXT,
    orgao_emissor VARCHAR(255),
    numero_alvara VARCHAR(100),
    data_emissao DATE,
    data_validade DATE,
    status VARCHAR(50),
    criado_em TIMESTAMP,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_alvaras_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

-- Auditoria Processos
CREATE TABLE processos_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    empresa_locataria_id VARCHAR(100),
    alvara_id UUID,
    descricao VARCHAR(500),
    status VARCHAR(50),
    prazo_estimado DATE,
    observacoes TEXT,
    criado_em TIMESTAMP,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_processos_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);
