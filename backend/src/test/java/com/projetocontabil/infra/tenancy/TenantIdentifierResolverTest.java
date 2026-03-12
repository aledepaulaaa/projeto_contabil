package com.projetocontabil.infra.tenancy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * TDD — Teste de infraestrutura para TenantIdentifierResolver.
 * 
 * Valida que o TenantContext + TenantIdentifierResolver:
 * - Resolvem corretamente o tenant do contexto atual
 * - Lançam exceção quando não há tenant no contexto
 * - Isolam dados entre tenants distintos
 * 
 * Nota: Testes de integração com PostgreSQL real usarão @Testcontainers
 * em fase posterior (quando as entities JPA estiverem implementadas).
 */
@DisplayName("TenantIdentifierResolver — Resolução de Tenant")
class TenantIdentifierResolverTest {

    @Test
    @DisplayName("Deve resolver tenant do contexto atual")
    void deveResolverTenantDoContextoAtual() {
        // Arrange
        TenantContext.setCurrentTenant("escritorio-alpha");

        // Act
        var resolver = new TenantIdentifierResolver();
        var tenantId = resolver.resolveCurrentTenantIdentifier();

        // Assert
        assertEquals("escritorio-alpha", tenantId);

        // Cleanup
        TenantContext.clear();
    }

    @Test
    @DisplayName("Deve lançar exceção quando tenant não estiver no contexto")
    void deveLancarExcecaoQuandoTenantNaoEstiverNoContexto() {
        // Arrange
        TenantContext.clear();

        // Act & Assert
        var resolver = new TenantIdentifierResolver();
        assertThrows(IllegalStateException.class,
                resolver::resolveCurrentTenantIdentifier,
                "Deve lançar exceção quando não há tenant no contexto");
    }

    @Test
    @DisplayName("Contextos de tenants diferentes devem ser isolados")
    void contextosDeTenantsDeveSerIsolados() {
        // Arrange & Act — Tenant A
        TenantContext.setCurrentTenant("escritorio-alpha");
        var resolver = new TenantIdentifierResolver();
        assertEquals("escritorio-alpha", resolver.resolveCurrentTenantIdentifier());

        // Act — Trocar para Tenant B
        TenantContext.setCurrentTenant("escritorio-beta");
        assertEquals("escritorio-beta", resolver.resolveCurrentTenantIdentifier());

        // Cleanup
        TenantContext.clear();
    }
}
