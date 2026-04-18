package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.domain.crm.model.StatusLead;
import com.projetocontabil.core.domain.crm.vo.Email;
import com.projetocontabil.core.domain.crm.vo.Identificacao;
import com.projetocontabil.core.domain.crm.vo.Telefone;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.domain.departamento.model.Departamento;
import com.projetocontabil.core.ports.driven.AtendimentoRepository;
import com.projetocontabil.core.ports.driven.DepartamentoRepository;
import com.projetocontabil.core.ports.driven.LeadRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LeadFluxoComercialTDDTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LeadRepository leadRepository;

    @MockitoBean
    private DepartamentoRepository departamentoRepository;

    @MockitoBean
    private AtendimentoRepository atendimentoRepository;

    @MockitoBean
    private SimpMessagingTemplate messagingTemplate;

    @MockitoBean
    private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    @MockitoBean
    private org.springframework.mail.javamail.JavaMailSender mailSender;

    @MockitoBean
    private org.springframework.web.client.RestTemplate restTemplate;

    private static final String TENANT = "test-tenant";
    private static final UUID COMERCIAL_ID = UUID.randomUUID();

    @Test
    void aoMoverLeadParaPropostaSemSetorDeveAtribuirComercialENotificar() throws Exception {
        UUID leadId = UUID.randomUUID();
        Lead leadSemDepto = Lead.reconstituir(leadId, EmpresaLocatariaId.of(TENANT), "Lead Teste", new Email("teste@test.com"),
                new Telefone("11999999999"), new Identificacao("00000000000001"), "Empresa 1",
                StatusLead.LEAD, null, null, null, null, null, LocalDateTime.now(), 0, false);

        Departamento deptoComercial = Departamento.reconstituir(COMERCIAL_ID, TENANT, "Comercial", "Setor Comercial", LocalDateTime.now());

        when(leadRepository.findById(leadId)).thenReturn(Optional.of(leadSemDepto));
        when(departamentoRepository.findByNomeAndEmpresaLocatariaId(eq("Comercial"), anyString())).thenReturn(Optional.of(deptoComercial));
        when(atendimentoRepository.findAtivoPorLead(leadId)).thenReturn(Optional.empty());

        mockMvc.perform(patch("/api/leads/" + leadId + "/status")
                .header("X-EmpresaLocataria-Id", TENANT)
                .param("status", "PROPOSTA"))
                .andExpect(status().isOk());

        // Verificações
        // 1. Deve ter salvado o lead com o departamento ID setado
        verify(leadRepository, atLeastOnce()).save(argThat(l -> l.getDepartamentoId() != null && l.getDepartamentoId().equals(COMERCIAL_ID)));

        // 2. Deve ter notificado o setor específico via WebSocket
        // O destino esperado é /topic/leads/{TENANT}/{COMERCIAL_ID}
        verify(messagingTemplate).convertAndSend(eq("/topic/leads/" + TENANT + "/" + COMERCIAL_ID), anyMap());
    }
}
