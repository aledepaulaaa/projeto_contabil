package com.projetocontabil.core.domain.crm.vo;

import com.projetocontabil.core.domain.shared.ValueObject;

public record Email(String value) implements ValueObject {
    public Email {
        if (value == null || !value.contains("@")) {
            throw new IllegalArgumentException("E-mail inválido");
        }
    }
}
