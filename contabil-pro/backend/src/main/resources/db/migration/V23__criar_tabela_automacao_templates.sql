-- V23__criar_tabela_automacao_templates.sql
CREATE TABLE IF NOT EXISTS automacao_templates (
    id UUID PRIMARY KEY,
    empresa_locataria_id VARCHAR(50) NOT NULL,
    gatilho VARCHAR(50) NOT NULL,
    texto TEXT NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_locataria_id, gatilho)
);

CREATE TABLE IF NOT EXISTS automacao_templates_AUD (
    id UUID NOT NULL,
    REV INTEGER NOT NULL,
    REVTYPE SMALLINT,
    empresa_locataria_id VARCHAR(50),
    gatilho VARCHAR(50),
    texto TEXT,
    PRIMARY KEY (id, REV),
    CONSTRAINT fk_automacao_templates_aud_revinfo FOREIGN KEY (REV) REFERENCES revinfo (REV)
);
