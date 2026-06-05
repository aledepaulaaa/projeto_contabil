-- V24: Módulo Corporate — Tabelas de Empresas, Contatos e Endereços
-- Multi-tenancy: isolamento estrito via empresa_locataria_id
-- Auditoria Envers: tabelas _aud para histórico

-- ═══ EMPRESAS ═══
CREATE TABLE empresas (
    id                      UUID PRIMARY KEY,
    empresa_locataria_id    VARCHAR(50) NOT NULL,
    razao_social            VARCHAR(255) NOT NULL,
    nome_fantasia           VARCHAR(255),
    identificacao           VARCHAR(20) NOT NULL, -- CPF, CNPJ ou CAEPF
    regime_tributario       VARCHAR(50) NOT NULL, -- MEI, SIMPLES, PRESUMIDO, REAL
    identificador_interno   VARCHAR(50),
    ativa                   BOOLEAN DEFAULT TRUE,
    criado_em               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_empresas_locataria FOREIGN KEY (empresa_locataria_id)
        REFERENCES empresas_locatarias(empresa_locataria_id) ON DELETE CASCADE
);

CREATE TABLE empresas_aud (
    id                      UUID NOT NULL,
    rev                     INTEGER NOT NULL,
    revtype                 SMALLINT,
    empresa_locataria_id    VARCHAR(50),
    razao_social            VARCHAR(255),
    nome_fantasia           VARCHAR(255),
    identificacao           VARCHAR(20),
    regime_tributario       VARCHAR(50),
    identificador_interno   VARCHAR(50),
    ativa                   BOOLEAN,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_empresas_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

-- ═══ CONTATOS DA EMPRESA ═══
CREATE TABLE empresa_contatos (
    id                      UUID PRIMARY KEY,
    empresa_id              UUID NOT NULL,
    nome                    VARCHAR(255) NOT NULL,
    cargo                   VARCHAR(100),
    departamento            VARCHAR(100),
    celular                 VARCHAR(20),
    email                   VARCHAR(255),
    CONSTRAINT fk_contatos_empresa FOREIGN KEY (empresa_id)
        REFERENCES empresas(id) ON DELETE CASCADE
);

CREATE TABLE empresa_contatos_aud (
    id                      UUID NOT NULL,
    rev                     INTEGER NOT NULL,
    revtype                 SMALLINT,
    empresa_id              UUID,
    nome                    VARCHAR(255),
    cargo                   VARCHAR(100),
    departamento            VARCHAR(100),
    celular                 VARCHAR(20),
    email                   VARCHAR(255),
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_contatos_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

-- ═══ ENDEREÇOS DA EMPRESA ═══
CREATE TABLE empresa_enderecos (
    id                      UUID PRIMARY KEY,
    empresa_id              UUID NOT NULL,
    logradouro              VARCHAR(255) NOT NULL,
    numero                  VARCHAR(20),
    complemento             VARCHAR(100),
    cep                     VARCHAR(15),
    bairro                  VARCHAR(100),
    cidade                  VARCHAR(100),
    uf                      CHAR(2),
    inscricao_estadual      VARCHAR(50),
    inscricao_municipal     VARCHAR(50),
    isento_icms             BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_enderecos_empresa FOREIGN KEY (empresa_id)
        REFERENCES empresas(id) ON DELETE CASCADE
);

CREATE TABLE empresa_enderecos_aud (
    id                      UUID NOT NULL,
    rev                     INTEGER NOT NULL,
    revtype                 SMALLINT,
    empresa_id              UUID,
    logradouro              VARCHAR(255),
    numero                  VARCHAR(20),
    complemento             VARCHAR(100),
    cep                     VARCHAR(15),
    bairro                  VARCHAR(100),
    cidade                  VARCHAR(100),
    uf                      CHAR(2),
    inscricao_estadual      VARCHAR(50),
    inscricao_municipal     VARCHAR(50),
    isento_icms             BOOLEAN,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_enderecos_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

-- ═══ ÍNDICES ═══
CREATE INDEX idx_empresas_locataria ON empresas(empresa_locataria_id);
CREATE INDEX idx_empresas_identificacao ON empresas(identificacao);
CREATE INDEX idx_empresa_contatos_empresa ON empresa_contatos(empresa_id);
CREATE INDEX idx_empresa_enderecos_empresa ON empresa_enderecos(empresa_id);
