package com.projetocontabil.core.domain.serpro.model;

import com.projetocontabil.core.domain.shared.ValueObject;

/**
 * Value Object contendo um item específico de rendimento decodificado.
 */
public record DadoRenda(String codigo, String texto, String valor) implements ValueObject {

    public DadoRenda {
        if (codigo == null || codigo.isBlank()) {
            throw new IllegalArgumentException("Código do rendimento é obrigatório.");
        }
        if (texto == null || texto.isBlank()) {
            throw new IllegalArgumentException("Descrição do rendimento é obrigatória.");
        }
    }
}
