package com.projetocontabil.infra.tenancy;

/**
 * Holder estático para o TenantId da requisição atual.
 *
 * <p>Utiliza {@link ThreadLocal} para garantir isolamento entre threads.
 * Cada request HTTP popula este contexto via {@code TenantFilter}
 * e o limpa ao final do processamento.</p>
 *
 * <p><strong>Ciclo de vida:</strong></p>
 * <ol>
 *   <li>{@code TenantFilter} extrai o tenant do header/JWT</li>
 *   <li>{@code setCurrentTenant(tenantId)} armazena no ThreadLocal</li>
 *   <li>Hibernate {@code TenantIdentifierResolver} lê via {@code getCurrentTenant()}</li>
 *   <li>{@code clear()} é chamado no finally do filter</li>
 * </ol>
 *
 * <p><strong>Nota sobre Virtual Threads (Java 21):</strong>
 * ThreadLocal funciona corretamente com Virtual Threads.
 * Futuramente, pode ser migrado para {@code ScopedValue} (preview)
 * para melhor semântica de escopo.</p>
 */
public final class TenantContext {

    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();

    private TenantContext() {
        // Utility class — não instanciável
    }

    /**
     * Define o tenant para a thread/request atual.
     *
     * @param tenantId identificador do tenant (ex: "escritorio-alpha")
     */
    public static void setCurrentTenant(String tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    /**
     * Recupera o tenant da thread/request atual.
     *
     * @return o identificador do tenant atual, ou {@code null} se não definido
     */
    public static String getCurrentTenant() {
        return CURRENT_TENANT.get();
    }

    /**
     * Limpa o contexto do tenant.
     * <strong>Deve ser chamado no finally do filter para evitar vazamento de memória.</strong>
     */
    public static void clear() {
        CURRENT_TENANT.remove();
    }
}
