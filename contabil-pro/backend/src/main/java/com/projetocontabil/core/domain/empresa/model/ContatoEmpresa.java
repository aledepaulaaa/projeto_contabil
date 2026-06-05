package com.projetocontabil.core.domain.empresa.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class ContatoEmpresa {
    private final UUID id;
    private String nome;
    private String cargo;
    private String departamento;
    private String celular;
    private String email;

    public static ContatoEmpresa novo(String nome, String cargo, String depto, String celular, String email) {
        return new ContatoEmpresa(UUID.randomUUID(), nome, cargo, depto, celular, email);
    }
}
