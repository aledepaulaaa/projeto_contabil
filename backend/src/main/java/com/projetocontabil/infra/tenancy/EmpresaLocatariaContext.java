package com.projetocontabil.infra.tenancy;

/**
 * Contexto de ThreadLocal para armazenar o identificador da EmpresaLocataria atual.
 */
public class EmpresaLocatariaContext {

    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();

    public static void setCurrentTenant(String tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static String getCurrentTenant() {
        return CURRENT_TENANT.get();
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}
