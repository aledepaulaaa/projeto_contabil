package com.projetocontabil.core.domain.tenant;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * TDD — Red Phase: Testes de domínio PURO para TenantId (Value Object).
 * 
 * ⚠️ ZERO frameworks de infraestrutura.
 * Estes testes devem FALHAR inicialmente (a classe TenantId não existe ainda).
 * Isso prova que o teste foi escrito ANTES da implementação (TDD legítimo).
 * 
 * Garante:
 * - Self-validation (rejeita null, vazio, espaços)
 * - Igualdade por valor (dois TenantId com mesmo valor são iguais)
 * - Desigualdade entre tenants diferentes
 */
@DisplayName("TenantId — Isolamento de Domínio (Value Object)")
class TenantIsolationTest {

    @Test
    @DisplayName("Deve criar TenantId válido com identificador não-vazio")
    void deveCriarTenantIdValido() {
        var tenantId = TenantId.of("escritorio-alpha");
        assertNotNull(tenantId);
        assertEquals("escritorio-alpha", tenantId.value());
    }

    @Test
    @DisplayName("Deve rejeitar TenantId nulo")
    void deveRejeitarTenantIdNulo() {
        assertThrows(IllegalArgumentException.class, () -> TenantId.of(null));
    }

    @Test
    @DisplayName("Deve rejeitar TenantId vazio")
    void deveRejeitarTenantIdVazio() {
        assertThrows(IllegalArgumentException.class, () -> TenantId.of(""));
    }

    @Test
    @DisplayName("Deve rejeitar TenantId com apenas espaços")
    void deveRejeitarTenantIdComEspacos() {
        assertThrows(IllegalArgumentException.class, () -> TenantId.of("   "));
    }

    @Test
    @DisplayName("TenantId deve ser Value Object — igualdade por valor")
    void tenantIdDeveSerValueObjectIgualdadePorValor() {
        var id1 = TenantId.of("escritorio-alpha");
        var id2 = TenantId.of("escritorio-alpha");
        assertEquals(id1, id2, "Dois TenantIds com o mesmo valor devem ser iguais");
        assertEquals(id1.hashCode(), id2.hashCode(), "hashCode deve ser consistente");
    }

    @Test
    @DisplayName("Tenants diferentes não devem ser iguais")
    void tenantsDiferentesNaoDevemSerIguais() {
        var id1 = TenantId.of("escritorio-alpha");
        var id2 = TenantId.of("escritorio-beta");
        assertNotEquals(id1, id2, "TenantIds com valores diferentes não devem ser iguais");
    }
}
