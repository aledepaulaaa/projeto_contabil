package com.projetocontabil.core.domain.crm.model;

import com.projetocontabil.core.domain.crm.model.enums.ConnectionProvider;
import com.projetocontabil.core.domain.crm.model.enums.ConnectionStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;

class ExternalConnectionTest {

    @Test
    @DisplayName("Deve falhar ao criar conexão sem empresa_locataria_id")
    void deveFalharSemEmpresaLocataria() {
        assertThrows(IllegalArgumentException.class, () -> {
            new ExternalConnection(
                UUID.randomUUID(),
                null, // empresa_locataria_id nulo
                ConnectionProvider.GOOGLE_ADS,
                "token",
                "refresh",
                LocalDateTime.now().plusHours(1),
                "123-456-7890",
                ConnectionStatus.ACTIVE,
                LocalDateTime.now()
            );
        });
    }
}
