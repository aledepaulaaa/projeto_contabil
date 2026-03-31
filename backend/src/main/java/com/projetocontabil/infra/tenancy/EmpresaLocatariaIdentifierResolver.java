package com.projetocontabil.infra.tenancy;

import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Component;

/**
 * Resolver de identificador de EmpresaLocataria para o Hibernate.
 */
@Component
public class EmpresaLocatariaIdentifierResolver implements CurrentTenantIdentifierResolver {

    @Override
    public String resolveCurrentTenantIdentifier() {
        String empresaId = EmpresaLocatariaContext.getEmpresaLocatariaId();
        return (empresaId != null) ? empresaId : "tenant-dev-mode";
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return true;
    }
}
