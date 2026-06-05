-- Upgrade 3.1: Módulo Onboarding
CREATE TABLE IF NOT EXISTS onboarding (
    id UUID PRIMARY KEY,
    empresa_locataria_id VARCHAR(255) NOT NULL,
    lead_id UUID NOT NULL,
    resumo_ia TEXT,
    status VARCHAR(50) NOT NULL,
    criado_em TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS onboarding_tarefas (
    id UUID PRIMARY KEY,
    onboarding_id UUID NOT NULL REFERENCES onboarding(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    status VARCHAR(50) NOT NULL,
    data_inicio TIMESTAMP,
    data_fim TIMESTAMP
);

-- Auditoria (Envers)
CREATE TABLE IF NOT EXISTS onboarding_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    resumo_ia TEXT,
    status VARCHAR(50),
    PRIMARY KEY (id, rev)
);

CREATE TABLE IF NOT EXISTS onboarding_tarefas_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    titulo VARCHAR(255),
    descricao TEXT,
    status VARCHAR(50),
    PRIMARY KEY (id, rev)
);
