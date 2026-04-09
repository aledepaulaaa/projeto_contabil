-- V13: Adiciona campo de observação para leads que não fecharam
ALTER TABLE leads ADD COLUMN IF NOT EXISTS observacao_nao_fechamento TEXT;
