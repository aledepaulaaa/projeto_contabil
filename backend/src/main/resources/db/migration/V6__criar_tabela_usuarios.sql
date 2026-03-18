-- V6: Criar tabela de usuários para autenticação real
CREATE TABLE usuarios (
    id UUID PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    tenant_id VARCHAR(50) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed de um usuário administrador para o tenant de teste (password: 'password' cryptografado com BCrypt fictício se necessário, mas o Simulador ainda aceita plain)
-- Para persistência real, usaremos BCrypt no futuro.
INSERT INTO usuarios (id, username, password, email, tenant_id, ativo, criado_em)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'admin', 'password', 'admin@empresa.com.br', '06549203856020', TRUE, CURRENT_TIMESTAMP);
