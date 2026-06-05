package com.projetocontabil.core.domain.crm.vo;

import com.projetocontabil.core.domain.shared.ValueObject;

public record Telefone(String value) implements ValueObject {
    public Telefone {
        if (value != null && value.length() < 10) {
            throw new IllegalArgumentException("Telefone inválido");
        }
    }
}
