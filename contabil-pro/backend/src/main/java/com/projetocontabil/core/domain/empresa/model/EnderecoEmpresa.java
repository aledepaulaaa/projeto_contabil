package com.projetocontabil.core.domain.empresa.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class EnderecoEmpresa {
    private final UUID id;
    private String logradouro;
    private String numero;
    private String complemento;
    private String cep;
    private String bairro;
    private String cidade;
    private String uf;
    private String inscricaoEstadual;
    private String inscricaoMunicipal;
    private boolean isentoIcms;

    public static EnderecoEmpresa novo(String logradouro, String numero, String cep, String bairro, String cidade, String uf) {
        return new EnderecoEmpresa(UUID.randomUUID(), logradouro, numero, null, cep, bairro, cidade, uf, null, null, false);
    }
}
