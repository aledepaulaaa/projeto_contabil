-- V15: Atualiza a constraint de status para suportar os novos estados GERANDO e ERRO
-- Remove a constraint antiga gerada automaticamente ou por versões anteriores
ALTER TABLE contratos DROP CONSTRAINT IF EXISTS contratos_status_check;

-- Aplica a nova constraint com suporte aos novos estados da máquina de estados
ALTER TABLE contratos ADD CONSTRAINT contratos_status_check 
CHECK (status IN ('GERANDO', 'ERRO', 'AGUARDANDO_ASSINATURA', 'ATIVO', 'CANCELADO'));
