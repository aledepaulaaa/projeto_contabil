package com.projetocontabil.core.domain.crm.model;

import com.projetocontabil.core.domain.crm.vo.Email;
import com.projetocontabil.core.domain.crm.vo.Identificacao;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Lead — Regra de Não Fechamento com Observação")
class LeadNaoFechamentoTest {

    private final EmpresaLocatariaId empresaId = EmpresaLocatariaId.of("tenant-test");

    @Test
    @DisplayName("Deve registrar observação ao mover para NAO_FECHOU")
    void deveRegistrarObservacaoNaoFechamento() {
        var lead = Lead.criar(empresaId, "Carlos", new Email("carlos@test.com"), null,
                new Identificacao("12345678901234"), "Empresa X", OrigemLead.ORGANICO, TipoServico.ABERTURA);

        lead.registrarNaoFechamento("Preço fora do orçamento do cliente");

        assertEquals(StatusLead.NAO_FECHOU, lead.getStatus());
        assertEquals("Preço fora do orçamento do cliente", lead.getObservacaoNaoFechamento());
    }

    @Test
    @DisplayName("Deve limpar observação ao sair de NAO_FECHOU")
    void deveLimparObservacaoAoSairDeNaoFechou() {
        var lead = Lead.criar(empresaId, "Ana", new Email("ana@test.com"), null,
                new Identificacao("12345678901234"), "Empresa Y", null, null);

        lead.registrarNaoFechamento("Não tem interesse agora");
        assertEquals(StatusLead.NAO_FECHOU, lead.getStatus());

        lead.mudarStatus(StatusLead.LEAD);
        assertNull(lead.getObservacaoNaoFechamento());
    }

    @Test
    @DisplayName("Não deve registrar observação vazia")
    void naoDeveRegistrarObservacaoVazia() {
        var lead = Lead.criar(empresaId, "Pedro", new Email("pedro@test.com"), null,
                new Identificacao("12345678901234"), "Empresa Z", null, null);

        assertThrows(IllegalArgumentException.class,
                () -> lead.registrarNaoFechamento(""));
        assertThrows(IllegalArgumentException.class,
                () -> lead.registrarNaoFechamento(null));
    }
}
