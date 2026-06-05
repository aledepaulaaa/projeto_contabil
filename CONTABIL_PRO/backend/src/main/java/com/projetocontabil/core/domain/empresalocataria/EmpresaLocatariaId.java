package com.projetocontabil.core.domain.empresalocataria;

import com.projetocontabil.core.domain.shared.ValueObject;

/**
 * Value Object tipado para identificação de Empresa Locataria.
 * Substitui o antigo TenantId para maior clareza comercial.
 */
public record EmpresaLocatariaId(String value) implements ValueObject {

    public EmpresaLocatariaId {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(
                    "EmpresaLocatariaId não pode ser nulo, vazio ou conter apenas espaços em branco"
            );
        }
    }

    public static EmpresaLocatariaId of(String value) {
        return new EmpresaLocatariaId(value);
    }
}
