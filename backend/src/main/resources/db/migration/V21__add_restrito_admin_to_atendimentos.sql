-- V21: Adiciona flag de privacidade para chats restritos ao Admin
ALTER TABLE atendimentos ADD COLUMN restrito_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE atendimentos_aud ADD COLUMN restrito_admin BOOLEAN DEFAULT FALSE;
