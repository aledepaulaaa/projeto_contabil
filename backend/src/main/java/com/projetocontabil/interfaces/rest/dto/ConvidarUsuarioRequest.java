package com.projetocontabil.interfaces.rest.dto;

import java.util.Set;
import java.util.UUID;

public record ConvidarUsuarioRequest(
        String email,
        String nome,
        String papel,
        UUID departamentoId,
        Set<String> permissoes
) {}
