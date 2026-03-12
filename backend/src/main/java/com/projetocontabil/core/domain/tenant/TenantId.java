package com.projetocontabil.core.domain.tenant;

import com.projetocontabil.core.domain.shared.ValueObject;

/**
 * Value Object tipado para identificação de Tenant.
 *
 * <p>Garante imutabilidade (record) e self-validation.
 * A igualdade por valor é fornecida automaticamente pelo Java Record
 * ({@code equals}, {@code hashCode}, {@code toString}).</p>
 *
 * <p><strong>Regra de domínio:</strong> um TenantId nunca pode ser nulo,
 * vazio ou conter apenas espaços em branco.</p>
 *
 * @param value identificador textual do tenant (ex: "escritorio-alpha")
 */
public record TenantId(String value) implements ValueObject {

    /**
     * Construtor canônico com validação.
     */
    public TenantId {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(
                    "TenantId não pode ser nulo, vazio ou conter apenas espaços em branco"
            );
        }
    }

    /**
     * Factory method para criação idiomática.
     *
     * @param value identificador textual do tenant
     * @return nova instância de TenantId validada
     * @throws IllegalArgumentException se value for nulo, vazio ou apenas espaços
     */
    public static TenantId of(String value) {
        return new TenantId(value);
    }
}
