-- ══════════════════════════════════════════════════════════
-- V3 — Tabela de Obrigações Tributárias (Rotinas)
-- ══════════════════════════════════════════════════════════

CREATE TABLE obrigacoes (
    id           UUID PRIMARY KEY,
    empresa_locataria_id    VARCHAR(100) NOT NULL,
    tipo         VARCHAR(50)  NOT NULL,
    regime       VARCHAR(50)  NOT NULL,
    valor        NUMERIC(15,2) NOT NULL,
    vencimento   DATE NOT NULL,
    status       VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
    competencia  DATE,
    criado_em    TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_obrigacoes_empresa FOREIGN KEY (empresa_locataria_id)
        REFERENCES empresas_locatarias(empresa_locataria_id) ON DELETE CASCADE
);

CREATE INDEX idx_obrigacoes_empresa_id ON obrigacoes(empresa_locataria_id);
CREATE INDEX idx_obrigacoes_pendentes_empresa ON obrigacoes(empresa_locataria_id, status)
    WHERE status = 'PENDENTE';

-- Auditoria
CREATE TABLE obrigacoes_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    empresa_locataria_id VARCHAR(100),
    tipo VARCHAR(50),
    regime VARCHAR(50),
    valor NUMERIC(15,2),
    vencimento DATE,
    status VARCHAR(50),
    competencia DATE,
    criado_em TIMESTAMP,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_obrigacoes_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);
