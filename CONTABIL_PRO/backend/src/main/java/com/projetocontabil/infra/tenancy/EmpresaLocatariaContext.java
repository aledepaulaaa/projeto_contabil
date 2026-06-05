package com.projetocontabil.infra.tenancy;

/**
 * Contexto de ThreadLocal para armazenar o identificador da EmpresaLocataria atual.
 */
public class EmpresaLocatariaContext {

    private static final ThreadLocal<String> CURRENT_CONTEXT = new ThreadLocal<>();

    public static void setEmpresaLocatariaId(String empresaId) {
        CURRENT_CONTEXT.set(empresaId);
    }

    public static String getEmpresaLocatariaId() {
        return CURRENT_CONTEXT.get();
    }

    public static void clear() {
        CURRENT_CONTEXT.remove();
    }
}
