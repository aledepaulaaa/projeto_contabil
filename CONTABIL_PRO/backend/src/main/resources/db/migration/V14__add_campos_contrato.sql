-- V14: Adiciona campos extras na tabela de contratos para integração ZapSign
CREATE TABLE IF NOT EXISTS contratos (
    id UUID PRIMARY KEY,
    lead_id UUID NOT NULL,
    empresa_locataria_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    motivo_cancelamento TEXT,
    url_documento_zapsign TEXT,
    nome_contato VARCHAR(255),
    email_contato VARCHAR(255),
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP
);

-- Se a tabela já existir (criada por ddl-auto: update), apenas adicionar as colunas novas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contratos' AND column_name='url_documento_zapsign') THEN
        ALTER TABLE contratos ADD COLUMN url_documento_zapsign TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contratos' AND column_name='nome_contato') THEN
        ALTER TABLE contratos ADD COLUMN nome_contato VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contratos' AND column_name='email_contato') THEN
        ALTER TABLE contratos ADD COLUMN email_contato VARCHAR(255);
    END IF;
END $$;
