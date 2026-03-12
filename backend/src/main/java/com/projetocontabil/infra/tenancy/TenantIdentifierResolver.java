package com.projetocontabil.infra.tenancy;

/**
 * Resolver de identificador de Tenant para o Hibernate.
 *
 * <p>Implementa o contrato de resolução de tenant que será
 * utilizado pelo Hibernate para aplicar automaticamente o filtro
 * {@code @FilterDef} de discriminator column em todas as queries.</p>
 *
 * <p>Recupera o tenant atual do {@link TenantContext} (ThreadLocal).
 * Se o contexto estiver vazio, lança {@link IllegalStateException}
 * para evitar queries sem isolamento — falha rápida é preferível
 * a vazamento de dados entre tenants.</p>
 */
public class TenantIdentifierResolver {

    /**
     * Resolve o identificador do tenant para a sessão atual do Hibernate.
     *
     * @return o identificador textual do tenant atual
     * @throws IllegalStateException se nenhum tenant estiver no contexto
     */
    public String resolveCurrentTenantIdentifier() {
        String tenantId = TenantContext.getCurrentTenant();

        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException(
                    "Nenhum Tenant definido no contexto atual. "
                  + "Verifique se o TenantFilter está configurado corretamente "
                  + "e se o header/JWT contém o identificador do tenant."
            );
        }

        return tenantId;
    }

    /**
     * Valida se o resolver suporta multi-tenancy.
     *
     * @return {@code true} — este resolver está sempre ativo
     */
    public boolean validateExistingCurrentSessions() {
        return true;
    }
}
