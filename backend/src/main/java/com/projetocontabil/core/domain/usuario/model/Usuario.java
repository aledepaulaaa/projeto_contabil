package com.projetocontabil.core.domain.usuario.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class Usuario {
    private final UUID id;
    private final String empresaLocatariaId;
    private final String email;
    private final String senhaHash;
    private final String nome;
    private final String role;
    private final boolean ativo;

    public static Usuario reconstituir(UUID id, String empresaLocatariaId, String email, String senhaHash, String nome, String role, boolean ativo) {
        return new Usuario(id, empresaLocatariaId, email, senhaHash, nome, role, ativo);
    }
}
