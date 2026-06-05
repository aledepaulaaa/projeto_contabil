-- V10: Limpeza de dados de teste e configuração do usuário oficial
-- Remove todos os leads e dados sensíveis para garantir um ambiente limpo

DELETE FROM historico_vida_lead;
DELETE FROM leads;
DELETE FROM obrigacoes;
DELETE FROM processos;
DELETE FROM alvaras;

-- Auditoria (Envers) - Limpeza facultativa mas recomendada para reset total
DELETE FROM leads_aud;
DELETE FROM obrigacoes_aud;
DELETE FROM processos_aud;
DELETE FROM alvaras_aud;
DELETE FROM usuarios_aud;

-- Garantir que apenas o administrador oficial exista
DELETE FROM usuarios WHERE email != 'admin@projetocontabil.com.br';

-- Atualiza ou insere o administrador oficial
INSERT INTO usuarios (id, username, password, email, empresa_locataria_id, ativo, criado_em)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'admin', 'password', 'admin@projetocontabil.com.br', 'tenant-dev-mode', TRUE, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO UPDATE 
SET username = 'admin', password = 'password', empresa_locataria_id = 'tenant-dev-mode';
