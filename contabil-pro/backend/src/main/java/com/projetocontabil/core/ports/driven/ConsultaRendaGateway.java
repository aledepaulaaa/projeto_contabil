package com.projetocontabil.core.ports.driven;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.domain.serpro.model.RendaContribuinte;

import java.util.List;
import java.util.Map;

/**
 * Driven Port desacoplada para realizar chamadas à API de Consulta Renda e Compartilha Receita do SERPRO.
 */
public interface ConsultaRendaGateway {

    /**
     * Consulta as informações completas de renda de uma pessoa física a partir do token de compartilhamento.
     */
    RendaContribuinte consultar(String tokenCompartilhamento, EmpresaLocatariaId tenantId);

    /**
     * Consulta as autorizações registradas de compartilhamento de dados de um titular.
     */
    List<Map<String, Object>> listarAutorizacoes(String niContratante, String niTitularDados, EmpresaLocatariaId tenantId);
}
