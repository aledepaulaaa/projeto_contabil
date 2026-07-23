-- V27: Adicionar colunas faltantes de automação em empresas_locatarias e quantidade de mensagens não lidas em leads

-- 1. Empresas Locatárias
ALTER TABLE empresas_locatarias ADD COLUMN IF NOT EXISTS whatsapp_automacao_ativo BOOLEAN DEFAULT TRUE;
ALTER TABLE empresas_locatarias ADD COLUMN IF NOT EXISTS email_automacao_ativo BOOLEAN DEFAULT TRUE;

ALTER TABLE empresas_locatarias_aud ADD COLUMN IF NOT EXISTS whatsapp_automacao_ativo BOOLEAN;
ALTER TABLE empresas_locatarias_aud ADD COLUMN IF NOT EXISTS email_automacao_ativo BOOLEAN;

-- 2. Leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS quantidade_mensagens_nao_lidas INTEGER DEFAULT 0;

ALTER TABLE leads_aud ADD COLUMN IF NOT EXISTS quantidade_mensagens_nao_lidas INTEGER;
