-- V19: Adicionar flag de transferido na tabela de atendimentos para visibilidade no chat e CRM
ALTER TABLE atendimentos ADD COLUMN transferido BOOLEAN DEFAULT FALSE;

-- Atualizar tabela de auditoria
ALTER TABLE atendimentos_aud ADD COLUMN transferido BOOLEAN;
