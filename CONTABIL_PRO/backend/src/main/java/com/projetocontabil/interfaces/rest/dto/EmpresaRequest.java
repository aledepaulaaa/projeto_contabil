package com.projetocontabil.interfaces.rest.dto;

import com.projetocontabil.core.domain.empresa.model.RegimeTributario;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record EmpresaRequest(
    @NotBlank(message = "Razão Social é obrigatória")
    String razaoSocial,
    
    String nomeFantasia,
    
    @NotBlank(message = "Identificação (CNPJ/CPF/CAEPF) é obrigatória")
    String identificacao,
    
    @NotNull(message = "Regime Tributário é obrigatório")
    RegimeTributario regimeTributario,
    
    String identificadorInterno,
    
    List<ContatoRequest> contatos,
    
    List<EnderecoRequest> enderecos
) {}
