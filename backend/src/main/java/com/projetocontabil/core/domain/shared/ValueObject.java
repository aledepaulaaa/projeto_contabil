package com.projetocontabil.core.domain.shared;

/**
 * Interface marcadora para Value Objects do domínio.
 * Value Objects são identificados pelo seu valor (não por identidade).
 * Devem ser implementados como Java Records para garantir imutabilidade
 * e igualdade por valor automática.
 *
 * Exemplos: TenantId, Email, CNPJ, RegimeTributario.
 */
public interface ValueObject {
}
