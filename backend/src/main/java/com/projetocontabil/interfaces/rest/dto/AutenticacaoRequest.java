package com.projetocontabil.interfaces.rest.dto;

import lombok.Data;

@Data
public class AutenticacaoRequest {
    private String username;
    private String password;
    private String tenantId;
}
