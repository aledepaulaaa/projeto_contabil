package com.projetocontabil.infra.tenancy;

/**
 * Exceção lançada quando o TenantIdentifierResolver não consegue
 * resolver o tenant do contexto atual.
 *
 * <p>Isso indica que uma operação de banco de dados foi tentada
 * sem que o tenant da requisição tenha sido definido pelo TenantFilter.</p>
 *
 * <p>Cenários típicos:</p>
 * <ul>
 *   <li>Request sem header {@code X-Tenant-Id}</li>
 *   <li>JWT sem claim de tenant</li>
 *   <li>Operação em background sem contexto de tenant</li>
 * </ul>
 */
public class TenantNotResolvedException extends IllegalStateException {

    public TenantNotResolvedException() {
        super("Não foi possível resolver o Tenant do contexto atual. "
            + "Certifique-se de que o TenantFilter está ativo e que a requisição "
            + "contém o identificador do tenant.");
    }

    public TenantNotResolvedException(String message) {
        super(message);
    }
}
