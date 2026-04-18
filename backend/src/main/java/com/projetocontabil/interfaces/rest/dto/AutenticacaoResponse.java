package com.projetocontabil.interfaces.rest.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AutenticacaoResponse {
    private String token;
    private String type;
    private String empresaLocatariaId;
    private String papel;
    private String nome;
    private String email;
    private String nomeEmpresa;
    private UUID departamentoId;
    private String departamentoNome;
    private UUID usuarioId;
    private List<String> permissoes;
}
