package com.projetocontabil.interfaces.rest.dto;

public record ContatoRequest(
    String nome,
    String cargo,
    String departamento,
    String celular,
    String email
) {}
