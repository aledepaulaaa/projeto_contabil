package com.projetocontabil.interfaces.rest.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projetocontabil.infra.persistence.entity.EtapaFunilJpaEntity;
import com.projetocontabil.infra.persistence.repository.EtapaFunilJpaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EtapaFunilTDDTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private EtapaFunilJpaRepository etapaFunilJpaRepository;

    @MockitoBean
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @MockitoBean
    private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    @MockitoBean
    private org.springframework.mail.javamail.JavaMailSender mailSender;

    @MockitoBean
    private org.springframework.web.client.RestTemplate restTemplate;

    private static final String TENANT = "tenant-etapas-test";

    @Test
    void deveListarEtapasRetornandoPadroesSeVazio() throws Exception {
        when(etapaFunilJpaRepository.findAllByEmpresaLocatariaIdOrderByOrdemAsc(TENANT))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/crm/etapas")
                .header("X-EmpresaLocataria-Id", TENANT))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(6))))
                .andExpect(jsonPath("$[0].chave", is("LEAD")))
                .andExpect(jsonPath("$[1].chave", is("QUALIFICACAO")));
    }

    @Test
    void deveCriarNovaEtapaCustomizada() throws Exception {
        UUID newId = UUID.randomUUID();
        EtapaFunilJpaEntity nova = new EtapaFunilJpaEntity(newId, TENANT, "DOCUMENTACAO", "Documentação", 7, "#8b5cf6");

        when(etapaFunilJpaRepository.save(any())).thenReturn(nova);

        Map<String, Object> body = Map.of(
                "chave", "DOCUMENTACAO",
                "nome", "Documentação",
                "ordem", 7,
                "cor", "#8b5cf6"
        );

        mockMvc.perform(post("/api/crm/etapas")
                .header("X-EmpresaLocataria-Id", TENANT)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.chave", is("DOCUMENTACAO")))
                .andExpect(jsonPath("$.nome", is("Documentação")));
    }
}
