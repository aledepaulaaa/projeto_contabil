package com.projetocontabil.interfaces.rest.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projetocontabil.infra.persistence.entity.AnotacaoContatoJpaEntity;
import com.projetocontabil.infra.persistence.repository.AnotacaoContatoJpaRepository;
import com.projetocontabil.infra.persistence.repository.ContatoEmpresaJpaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AnotacaoContatoTDDTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AnotacaoContatoJpaRepository anotacaoContatoJpaRepository;

    @MockitoBean
    private ContatoEmpresaJpaRepository contatoEmpresaJpaRepository;

    @MockitoBean
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @MockitoBean
    private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    @MockitoBean
    private org.springframework.mail.javamail.JavaMailSender mailSender;

    @MockitoBean
    private org.springframework.web.client.RestTemplate restTemplate;

    private static final String TENANT = "tenant-anotacao-test";

    @Test
    void deveCriarEListarAnotacoesDeContato() throws Exception {
        UUID contatoId = UUID.randomUUID();
        AnotacaoContatoJpaEntity a1 = new AnotacaoContatoJpaEntity(
                UUID.randomUUID(), contatoId, TENANT, "Atendente João", "Comercial", "Cliente solicitou proposta para o regime Simples Nacional", LocalDateTime.now()
        );

        when(anotacaoContatoJpaRepository.findAllByContatoIdOrderByCriadoEmDesc(contatoId))
                .thenReturn(List.of(a1));

        mockMvc.perform(get("/api/atendimento/contatos/" + contatoId + "/anotacoes")
                .header("X-EmpresaLocataria-Id", TENANT))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].autor", is("Atendente João")))
                .andExpect(jsonPath("$[0].conteudo", containsString("Simples Nacional")));

        Map<String, String> body = Map.of(
                "autor", "Atendente Maria",
                "setor", "Contábil",
                "conteudo", "Documentação enviada para análise."
        );

        when(anotacaoContatoJpaRepository.save(any())).thenReturn(a1);

        mockMvc.perform(post("/api/atendimento/contatos/" + contatoId + "/anotacoes")
                .header("X-EmpresaLocataria-Id", TENANT)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.conteudo", notNullValue()));
    }
}
