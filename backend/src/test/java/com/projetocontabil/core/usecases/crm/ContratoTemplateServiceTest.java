package com.projetocontabil.core.usecases.crm;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ContratoTemplateService — Geração de Conteúdo Dinâmico")
class ContratoTemplateServiceTest {

    @Test
    @DisplayName("Deve substituir as variáveis do template pelos dados do lead")
    void deveGerarConteudoPreenchido() {
        var service = new ContratoTemplateService();
        
        Map<String, String> dados = Map.of(
            "RAZAO_SOCIAL", "Empresa de Teste LTDA",
            "NOME_CONTATO", "Carlos Oliveira",
            "IDENTIFICACAO", "12.345.678/0001-90",
            "VALOR_MENSAL", "R$ 499,00"
        );

        String result = service.gerarHtmlContrato(dados);

        assertTrue(result.contains("Empresa de Teste LTDA"), "Deve conter o nome da empresa");
        assertTrue(result.contains("Carlos Oliveira"), "Deve conter o nome do contato");
        assertTrue(result.contains("12.345.678/0001-90"), "Deve conter o documento");
        assertTrue(result.contains("SUPREME CONTABILIDADE LTDA"), "Deve conter os dados da contratada fixa");
    }
}
