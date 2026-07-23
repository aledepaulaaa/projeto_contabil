-- V25: Criar tabela de anotações de contato para histórico e timeline do cliente
CREATE TABLE IF NOT EXISTS anotacoes_contato (
    id UUID PRIMARY KEY,
    contato_id UUID NOT NULL,
    empresa_locataria_id VARCHAR(255) NOT NULL,
    autor VARCHAR(255),
    setor VARCHAR(255),
    conteudo TEXT NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_anotacoes_contato_tenant ON anotacoes_contato(empresa_locataria_id, contato_id);

-- Tabela de auditoria Envers
CREATE TABLE IF NOT EXISTS anotacoes_contato_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    contato_id UUID,
    empresa_locataria_id VARCHAR(255),
    autor VARCHAR(255),
    setor VARCHAR(255),
    conteudo TEXT,
    criado_em TIMESTAMP,
    PRIMARY KEY (id, rev)
);
