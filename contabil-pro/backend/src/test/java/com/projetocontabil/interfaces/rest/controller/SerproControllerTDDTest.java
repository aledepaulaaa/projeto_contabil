package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.domain.serpro.model.DadoRenda;
import com.projetocontabil.core.domain.serpro.model.RendaContribuinte;
import com.projetocontabil.core.usecases.ConsultarRendaSerproUseCase;
import com.projetocontabil.infra.tenancy.EmpresaLocatariaContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class SerproControllerTDDTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ConsultarRendaSerproUseCase consultarRendaSerproUseCase;

    private final String empresaId = UUID.randomUUID().toString();
    private final String tokenCompartilhamento = "dUMZ7AZvTnhFjhPZOJTMfm0pb2jLu9s2PzYfndPMc4tl";

    @BeforeEach
    void setUp() {
        EmpresaLocatariaContext.setEmpresaLocatariaId(empresaId);
    }

    @Test
    @DisplayName("Fase Red: Deve consultar dados de renda com sucesso")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void deveConsultarRendaComSucesso() throws Exception {
        // GIVEN
        List<DadoRenda> dados = List.of(
                new DadoRenda("1", "Rendimentos Recebidos de Pessoas Jurídicas", "150000.00"),
                new DadoRenda("2", "Rendimentos Tributáveis", "120000.00"),
                new DadoRenda("3", "Patrimônio Total", "750000.00")
        );
        RendaContribuinte renda = RendaContribuinte.reconstituir(
                "12345678909",
                "33683111000107",
                LocalDateTime.now(),
                tokenCompartilhamento,
                "Aviso Legal LGPD",
                dados
        );

        when(consultarRendaSerproUseCase.executar(tokenCompartilhamento, EmpresaLocatariaId.of(empresaId)))
                .thenReturn(renda);

        // WHEN & THEN
        mockMvc.perform(get("/api/serpro/consulta-renda/" + tokenCompartilhamento)
                .header("X-Usuario-Id", UUID.randomUUID().toString())
                .header("X-EmpresaLocataria-Id", empresaId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titular").value("12345678909"))
                .andExpect(jsonPath("$.destinatario").value("33683111000107"))
                .andExpect(jsonPath("$.token").value(tokenCompartilhamento))
                .andExpect(jsonPath("$.dados[0].codigo").value("1"))
                .andExpect(jsonPath("$.dados[0].valor").value("150000.00"));

        verify(consultarRendaSerproUseCase, times(1))
                .executar(tokenCompartilhamento, EmpresaLocatariaId.of(empresaId));
    }

    @Test
    @DisplayName("Fase Red: Deve retornar 404 quando o CPF não possuir declaração")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void deveRetornar404QuandoNaoPossuiDeclaracao() throws Exception {
        // GIVEN
        String tokenSemDeclaracao = "ISoHYEiHK7P4zWXVO9yIpTGzo7J8aimo9ugwqRGoJYn4";
        
        when(consultarRendaSerproUseCase.executar(tokenSemDeclaracao, EmpresaLocatariaId.of(empresaId)))
                .thenThrow(new IllegalArgumentException("Declaração não encontrada para o CPF informado"));

        // WHEN & THEN
        mockMvc.perform(get("/api/serpro/consulta-renda/" + tokenSemDeclaracao)
                .header("X-Usuario-Id", UUID.randomUUID().toString())
                .header("X-EmpresaLocataria-Id", empresaId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Fase Red: Deve retornar 401 quando não for autorizado no SERPRO")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void deveRetornar401QuandoNaoAutorizado() throws Exception {
        // GIVEN
        when(consultarRendaSerproUseCase.executar(tokenCompartilhamento, EmpresaLocatariaId.of(empresaId)))
                .thenThrow(new IllegalStateException("Erro de autenticação com a API do SERPRO (Unauthorized)"));

        // WHEN & THEN
        mockMvc.perform(get("/api/serpro/consulta-renda/" + tokenCompartilhamento)
                .header("X-Usuario-Id", UUID.randomUUID().toString())
                .header("X-EmpresaLocataria-Id", empresaId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }
}
