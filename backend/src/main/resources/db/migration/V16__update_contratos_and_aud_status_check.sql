-- ══════════════════════════════════════════════════════════
-- V16 — Atualização de Constraints de Status (Contratos)
-- Suporte completo: GERANDO, ERRO, AGUARDANDO_ASSINATURA, ATIVO, CANCELADO, ARQUIVADO
-- ══════════════════════════════════════════════════════════

-- Atualiza constraint da tabela principal (Contratos)
ALTER TABLE contratos DROP CONSTRAINT IF EXISTS contratos_status_check;
ALTER TABLE contratos ADD CONSTRAINT contratos_status_check 
CHECK (status IN ('GERANDO', 'ERRO', 'AGUARDANDO_ASSINATURA', 'ATIVO', 'CANCELADO', 'ARQUIVADO'));

-- Atualiza constraint da tabela de auditoria (Hibernate Envers)
ALTER TABLE contratos_aud DROP CONSTRAINT IF EXISTS contratos_aud_status_check;
ALTER TABLE contratos_aud ADD CONSTRAINT contratos_aud_status_check 
CHECK (status IN ('GERANDO', 'ERRO', 'AGUARDANDO_ASSINATURA', 'ATIVO', 'CANCELADO', 'ARQUIVADO'));
