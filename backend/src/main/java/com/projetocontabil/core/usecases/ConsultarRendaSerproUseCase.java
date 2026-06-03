package com.projetocontabil.core.usecases;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.domain.serpro.model.RendaContribuinte;
import com.projetocontabil.core.ports.driven.ConsultaRendaGateway;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Caso de Uso de negócio responsável por coordenar a consulta de dados de renda junto ao gateway do SERPRO.
 * Valida as precondições de entrada e delega ao adaptador de infraestrutura mantendo o isolamento de tenant.
 */
@Service
@RequiredArgsConstructor
public class ConsultarRendaSerproUseCase {

    private final ConsultaRendaGateway consultaRendaGateway;

    /**
     * Executa a consulta de renda baseada no token recebido, validando regras básicas e mantendo isolamento tenant.
     *
     * @param tokenCompartilhamento Token obtido pelo consentimento do cidadão no portal e-CAC (Compartilha Receita).
     * @param tenantId              ID da Empresa Locatária para garantir o isolamento de multi-tenancy.
     * @return RendaContribuinte com os dados decifrados do contribuinte.
     */
    public RendaContribuinte executar(String tokenCompartilhamento, EmpresaLocatariaId tenantId) {
        if (tokenCompartilhamento == null || tokenCompartilhamento.isBlank()) {
            throw new IllegalArgumentException("O token de compartilhamento é obrigatório.");
        }
        if (tenantId == null) {
            throw new IllegalArgumentException("O ID da Empresa Locatária (Tenant) é obrigatório.");
        }

        return consultaRendaGateway.consultar(tokenCompartilhamento, tenantId);
    }
}
