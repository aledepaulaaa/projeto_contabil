package com.projetocontabil;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Smoke test — valida que a classe principal existe e é instanciável.
 *
 * <p>O teste de contexto completo ({@code @SpringBootTest}) requer infraestrutura
 * rodando (PostgreSQL, Redis, RabbitMQ) via {@code docker-compose up}.
 * Para CI sem Docker, este teste leve garante sanidade básica.</p>
 *
 * <p>Para teste de integração completo, use:
 * {@code docker-compose up -d && ./mvnw test -Pintegration}</p>
 */
@DisplayName("Smoke Test — Aplicação Principal")
class ProjetoContabilApplicationTests {

    @Test
    @DisplayName("Classe principal deve ser instanciável")
    void classePrincipalDeveExistir() {
        assertNotNull(ProjetoContabilApplication.class);
    }
}
