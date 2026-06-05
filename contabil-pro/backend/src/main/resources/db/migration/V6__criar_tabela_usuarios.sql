-- V6: Criar tabela de usuários para autenticação real
CREATE TABLE usuarios (
    id UUID PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    empresa_locataria_id VARCHAR(50) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuarios_empresa FOREIGN KEY (empresa_locataria_id)
        REFERENCES empresas_locatarias(empresa_locataria_id) ON DELETE CASCADE
);

-- Auditoria Usuarios
CREATE TABLE usuarios_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    username VARCHAR(100),
    email VARCHAR(150),
    empresa_locataria_id VARCHAR(50),
    ativo BOOLEAN,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_usuarios_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

-- Seed de um usuário administrador para a empresa de teste
INSERT INTO usuarios (id, username, password, email, empresa_locataria_id, ativo, criado_em)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'admin', 'password', 'admin@empresa.com.br', 'tenant-dev-mode', TRUE, CURRENT_TIMESTAMP);
