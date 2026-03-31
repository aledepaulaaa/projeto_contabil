-- V11: Adiciona coluna de arquivado ao histórico do lead
ALTER TABLE historico_vida_lead ADD COLUMN arquivado BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE historico_vida_lead_aud ADD COLUMN arquivado BOOLEAN;
