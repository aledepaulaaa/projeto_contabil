package com.projetocontabil.core.domain.crm.vo;

import com.projetocontabil.core.domain.shared.ValueObject;

public record Identificacao(String value) implements ValueObject {
    public Identificacao {
        if (value == null || (value.length() != 11 && value.length() != 14)) {
            throw new IllegalArgumentException("CPF/CNPJ inválido: deve ter 11 ou 14 dígitos.");
        }
    }

    public String formatado() {
        if (value.length() == 11) {
            return value.replaceAll("(\\d{3})(\\d{3})(\\d{3})(\\d{2})", "$1.$2.$3-$4");
        }
        return value.replaceAll("(\\d{2})(\\d{3})(\\d{3})(\\d{4})(\\d{2})", "$1.$2.$3/$4-$5");
    }
}
