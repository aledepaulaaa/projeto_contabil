-- Adiciona coluna de ID único do Google para idempotência
ALTER TABLE leads ADD COLUMN google_lead_id VARCHAR(100) UNIQUE;

-- Adiciona na tabela de auditoria (Envers)
ALTER TABLE leads_aud ADD COLUMN google_lead_id VARCHAR(100);
