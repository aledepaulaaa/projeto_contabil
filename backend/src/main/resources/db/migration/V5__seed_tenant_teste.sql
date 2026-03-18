-- ══════════════════════════════════════════════════════════
-- V5 — Seed de Tenant de Teste (Alexandre de Paula / 33000167000101)
-- ══════════════════════════════════════════════════════════

INSERT INTO tenants (id, tenant_id, nome_escritorio, plano, status, criado_em)
VALUES ('550e8400-e29b-41d4-a716-446655440000', '33000167000101', 'Empresa de Teste - Onboarding', 'AVANCADO', 'ATIVO', NOW())
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO tenants (id, tenant_id, nome_escritorio, plano, status, criado_em)
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'tenant-dev-mode', 'Escritório Contábil Dev', 'BASICO', 'ATIVO', NOW())
ON CONFLICT (tenant_id) DO NOTHING;
