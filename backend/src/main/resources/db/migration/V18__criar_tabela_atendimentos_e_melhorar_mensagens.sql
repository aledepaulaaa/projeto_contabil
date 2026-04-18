-- V18: Criar tabela de atendimentos e aprimorar mensagens de chat para suporte a tickets e privacidade

-- 1. Criar a tabela de atendimentos (Tickets)
CREATE TABLE atendimentos (
    id UUID PRIMARY KEY,
    lead_id UUID NOT NULL,
    empresa_locataria_id VARCHAR(255) NOT NULL,
    departamento_id UUID,
    atendente_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'AGUARDANDO',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    puxado_em TIMESTAMP,
    encerrado_em TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_atendimento_lead FOREIGN KEY (lead_id) REFERENCES leads(id),
    CONSTRAINT fk_atendimento_departamento FOREIGN KEY (departamento_id) REFERENCES departamentos(id),
    CONSTRAINT fk_atendimento_atendente FOREIGN KEY (atendente_id) REFERENCES usuarios(id)
);

-- Index para performance de busca por tenant e lead
CREATE INDEX idx_atendimento_tenant_lead ON atendimentos(empresa_locataria_id, lead_id);
CREATE INDEX idx_atendimento_status ON atendimentos(status);

-- 2. Atualizar a tabela de mensagens_chat
-- Se a tabela não existir (pode ter sido criada pelo Hibernate), o Flyway cuidará da consistência.
-- Caso já exista, adicionamos as colunas. 
-- Para compatibilidade com a limpeza de dados solicitada pelo usuário, podemos recriar ou ajustar.

ALTER TABLE mensagens_chat ADD COLUMN IF NOT EXISTS atendimento_id UUID;
ALTER TABLE mensagens_chat ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'EXTERNA'; -- EXTERNA ou INTERNA
ALTER TABLE mensagens_chat ADD COLUMN IF NOT EXISTS usuario_id UUID; -- ID do consultor que enviou (se CONSULTOR)
ALTER TABLE mensagens_chat ADD COLUMN IF NOT EXISTS visivel BOOLEAN DEFAULT TRUE;

-- Adicionar FK para atendimento (opcional dependendo da limpeza de dados)
ALTER TABLE mensagens_chat ADD CONSTRAINT fk_mensagem_atendimento FOREIGN KEY (atendimento_id) REFERENCES atendimentos(id) ON DELETE SET NULL;
ALTER TABLE mensagens_chat ADD CONSTRAINT fk_mensagem_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id);

-- 3. Adicionar flag de visibilidade no Lead (Privacidade da Conversa)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS conversa_privada BOOLEAN DEFAULT FALSE;

-- 4. Auditoria (Envers)
-- Caso as tabelas de auditoria (AUD) já existam, precisamos atualizar a estrutura também.
CREATE TABLE IF NOT EXISTS atendimentos_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    lead_id UUID,
    empresa_locataria_id VARCHAR(255),
    departamento_id UUID,
    atendente_id UUID,
    status VARCHAR(50),
    PRIMARY KEY (id, rev)
);
