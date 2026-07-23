-- V26: Criar tabela de etapas do funil personalizáveis do CRM
CREATE TABLE IF NOT EXISTS etapas_funil (
    id UUID PRIMARY KEY,
    empresa_locataria_id VARCHAR(255) NOT NULL,
    chave VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    ordem INTEGER NOT NULL,
    cor VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_etapas_funil_tenant ON etapas_funil(empresa_locataria_id);

-- Tabela de auditoria Envers
CREATE TABLE IF NOT EXISTS etapas_funil_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    empresa_locataria_id VARCHAR(255),
    chave VARCHAR(255),
    nome VARCHAR(255),
    ordem INTEGER,
    cor VARCHAR(255),
    PRIMARY KEY (id, rev)
);
