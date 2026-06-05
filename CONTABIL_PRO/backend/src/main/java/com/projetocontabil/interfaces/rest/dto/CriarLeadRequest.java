package com.projetocontabil.interfaces.rest.dto;

import jakarta.validation.constraints.NotBlank;

public record CriarLeadRequest(
    @NotBlank String nomeContato,
    @NotBlank String email,
    String cnpj,
    String telefone,
    @NotBlank String nomeEmpresa,
    String origem,
    String tipoServico
) {}
