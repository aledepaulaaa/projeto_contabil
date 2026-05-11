package com.projetocontabil.core.domain.crm.vo;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

class IdentificacaoTest {

    @Test
    @DisplayName("Deve aceitar CPF válido")
    void deveAceitarCpfValido() {
        Identificacao id = new Identificacao("123.456.789-01");
        assertEquals("12345678901", id.value());
    }

    @Test
    @DisplayName("Deve aceitar CNPJ válido")
    void deveAceitarCnpjValido() {
        Identificacao id = new Identificacao("12.345.678/0001-90");
        assertEquals("12345678000190", id.value());
    }

    @Test
    @DisplayName("Deve aceitar CAEPF válido")
    void deveAceitarCaepfValido() {
        // Exemplo da referência: 293.118.610/001-00
        Identificacao id = new Identificacao("293.118.610/001-00");
        assertEquals("29311861000100", id.value());
    }

    @ParameterizedTest
    @ValueSource(strings = {"123", "1234567890", "123456789012", "123456789012345"})
    @DisplayName("Deve rejeitar tamanhos inválidos")
    void deveRejeitarTamanhosInvalidos(String valor) {
        assertThrows(IllegalArgumentException.class, () -> new Identificacao(valor));
    }
}
