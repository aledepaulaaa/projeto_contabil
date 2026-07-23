package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.crm.model.StatusContrato;
import com.projetocontabil.core.domain.crm.model.StatusLead;
import com.projetocontabil.core.domain.rotinas.model.Obrigacao;
import com.projetocontabil.core.ports.driven.AlvaraRepository;
import com.projetocontabil.core.ports.driven.ContratoRepository;
import com.projetocontabil.core.ports.driven.LeadRepository;
import com.projetocontabil.core.ports.driven.ObrigacaoRepository;
import com.projetocontabil.infra.persistence.entity.ContratoJpaEntity;
import com.projetocontabil.infra.persistence.repository.ContratoJpaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DashboardMetricsTDDTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LeadRepository leadRepository;

    @MockitoBean
    private ObrigacaoRepository obrigacaoRepository;

    @MockitoBean
    private AlvaraRepository alvaraRepository;

    @MockitoBean
    private ContratoJpaRepository contratoJpaRepository;

    @MockitoBean
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @MockitoBean
    private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    @MockitoBean
    private org.springframework.mail.javamail.JavaMailSender mailSender;

    @MockitoBean
    private org.springframework.web.client.RestTemplate restTemplate;

    private static final String TENANT = "tenant-metrics-test";

    @Test
    void deveRetornarMetricasCompletasIncluindoLtvCacEChurn() throws Exception {
        when(leadRepository.countByEmpresaLocatariaIdAndStatus(any(), any())).thenReturn(10L);
        when(obrigacaoRepository.countByEmpresaLocatariaIdAndStatus(any(), any())).thenReturn(5L);
        when(alvaraRepository.countVencidosByEmpresaLocatariaId(any())).thenReturn(2L);

        ContratoJpaEntity c1 = new ContratoJpaEntity(UUID.randomUUID(), UUID.randomUUID(), TENANT, StatusContrato.ATIVO, null, "http://zap1", "Cliente A", "a@test.com", LocalDateTime.now(), LocalDateTime.now());
        ContratoJpaEntity c2 = new ContratoJpaEntity(UUID.randomUUID(), UUID.randomUUID(), TENANT, StatusContrato.CANCELADO, "Preço alto", null, "Cliente B", "b@test.com", LocalDateTime.now(), LocalDateTime.now());
        ContratoJpaEntity c3 = new ContratoJpaEntity(UUID.randomUUID(), UUID.randomUUID(), TENANT, StatusContrato.AGUARDANDO_ASSINATURA, null, null, "Cliente C", "c@test.com", LocalDateTime.now(), LocalDateTime.now());

        when(contratoJpaRepository.findAllByEmpresaLocatariaId(TENANT)).thenReturn(List.of(c1, c2, c3));

        mockMvc.perform(get("/api/dashboard/metrics")
                .header("X-EmpresaLocataria-Id", TENANT))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ltv", notNullValue()))
                .andExpect(jsonPath("$.cac", notNullValue()))
                .andExpect(jsonPath("$.contratosAtivos", is(1)))
                .andExpect(jsonPath("$.contratosCancelados", is(1)))
                .andExpect(jsonPath("$.contratosAguardando", is(1)))
                .andExpect(jsonPath("$.churnRate", notNullValue()))
                .andExpect(jsonPath("$.motivosChurn", notNullValue()));
    }
}
