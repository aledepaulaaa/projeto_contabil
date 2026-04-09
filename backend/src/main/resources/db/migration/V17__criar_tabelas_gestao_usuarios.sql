-- V17: Gestão de Usuários — Departamentos, Permissões e Convites
-- Multi-tenancy: isolamento estrito via empresa_locataria_id

-- ═══ DEPARTAMENTOS ═══
CREATE TABLE departamentos (
    id UUID PRIMARY KEY,
    empresa_locataria_id VARCHAR(50) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_departamentos_empresa FOREIGN KEY (empresa_locataria_id)
        REFERENCES empresas_locatarias(empresa_locataria_id) ON DELETE CASCADE,
    CONSTRAINT uq_departamento_nome_tenant UNIQUE (empresa_locataria_id, nome)
);

CREATE TABLE departamentos_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    empresa_locataria_id VARCHAR(50),
    nome VARCHAR(100),
    descricao VARCHAR(255),
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_departamentos_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

-- ═══ ATUALIZAR TABELA USUARIOS ═══
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS papel VARCHAR(20) DEFAULT 'ADMIN';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS departamento_id UUID;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS convidado_por UUID;

ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_departamento
    FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE SET NULL;

ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_convidado_por
    FOREIGN KEY (convidado_por) REFERENCES usuarios(id) ON DELETE SET NULL;

-- Atualizar tabela de auditoria de usuários
ALTER TABLE usuarios_aud ADD COLUMN IF NOT EXISTS papel VARCHAR(20);
ALTER TABLE usuarios_aud ADD COLUMN IF NOT EXISTS departamento_id UUID;
ALTER TABLE usuarios_aud ADD COLUMN IF NOT EXISTS convidado_por UUID;

-- ═══ TABELA DE PERMISSÕES (normalizada) ═══
CREATE TABLE usuario_permissoes (
    usuario_id UUID NOT NULL,
    permissao VARCHAR(50) NOT NULL,
    PRIMARY KEY (usuario_id, permissao),
    CONSTRAINT fk_permissoes_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE usuario_permissoes_aud (
    rev INTEGER NOT NULL,
    usuario_id UUID NOT NULL,
    permissao VARCHAR(50) NOT NULL,
    revtype SMALLINT,
    PRIMARY KEY (rev, usuario_id, permissao),
    CONSTRAINT fk_permissoes_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

-- ═══ CONVITES PENDENTES ═══
CREATE TABLE convites_usuario (
    id UUID PRIMARY KEY,
    empresa_locataria_id VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    papel VARCHAR(20) NOT NULL,
    departamento_id UUID,
    token VARCHAR(255) NOT NULL UNIQUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_em TIMESTAMP NOT NULL,
    convidado_por UUID NOT NULL,
    CONSTRAINT fk_convites_empresa FOREIGN KEY (empresa_locataria_id)
        REFERENCES empresas_locatarias(empresa_locataria_id) ON DELETE CASCADE,
    CONSTRAINT fk_convites_departamento FOREIGN KEY (departamento_id)
        REFERENCES departamentos(id) ON DELETE SET NULL,
    CONSTRAINT fk_convites_usuario FOREIGN KEY (convidado_por)
        REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ═══ SEED: Departamentos padrão para tenant de dev ═══
INSERT INTO departamentos (id, empresa_locataria_id, nome, descricao, criado_em)
VALUES
    (gen_random_uuid(), 'tenant-dev-mode', 'Comercial', 'Departamento de vendas e atendimento comercial', CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'tenant-dev-mode', 'Fiscal', 'Departamento de rotinas fiscais e tributárias', CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'tenant-dev-mode', 'Contábil', 'Departamento de contabilidade e demonstrações', CURRENT_TIMESTAMP);

-- ═══ Atualizar admin existente com papel ADMIN ═══
UPDATE usuarios SET papel = 'ADMIN' WHERE email = 'admin@projetocontabil.com.br';
