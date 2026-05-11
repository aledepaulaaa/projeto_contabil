package com.projetocontabil.interfaces.rest.dto;

public record EnderecoRequest(
    String logradouro,
    String numero,
    String complemento,
    String cep,
    String bairro,
    String cidade,
    String uf,
    String inscricaoEstadual,
    String inscricaoMunicipal,
    boolean isentoIcms
) {}
