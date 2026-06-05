package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.domain.crm.model.StatusLead;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.domain.usuario.model.Usuario;
import com.projetocontabil.core.ports.driven.*;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LeadAtendimentoIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean private LeadRepository leadRepository;
    @MockitoBean private AtendimentoRepository atendimentoRepository;
    @MockitoBean private DepartamentoRepository departamentoRepository;
    @MockitoBean private UsuarioRepository usuarioRepository;
    @MockitoBean private SimpMessagingTemplate messagingTemplate;
    @MockitoBean private RabbitTemplate rabbitTemplate;
    @MockitoBean private JavaMailSender mailSender;
    @MockitoBean private RestTemplate restTemplate;

    private static final UUID ADMIN_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Test
    @WithMockUser(username = "22222222-2222-2222-2222-222222222222")
    void deveListarLeadsFormatadosParaAtendimento() throws Exception {
        String tenantId = "test-tenant";
        UUID leadId = UUID.randomUUID();

        // Mock: Admin user via SecurityContext + UsuarioRepository
        when(usuarioRepository.findById(ADMIN_ID))
            .thenReturn(Optional.of(Usuario.reconstituirCompleto(
                ADMIN_ID, tenantId, "admin@test.com", "admin@test.com",
                "hash", "Admin", "ADMIN", true,
                com.projetocontabil.core.domain.usuario.model.Papel.ADMIN,
                null, null, null)));
        when(departamentoRepository.findAllByEmpresaLocatariaId(any())).thenReturn(Collections.emptyList());
        when(atendimentoRepository.findAllAtivosByEmpresa(anyString())).thenReturn(Collections.emptyList());

        Lead mockLead = mock(Lead.class);
        when(mockLead.getId()).thenReturn(leadId);
        when(mockLead.getNomeContato()).thenReturn("Roberto Silva");
        when(mockLead.getStatus()).thenReturn(StatusLead.PROPOSTA);
        when(mockLead.getEmpresaLocatariaId()).thenReturn(EmpresaLocatariaId.of(tenantId));

        when(leadRepository.findAllByEmpresaLocatariaId(any())).thenReturn(List.of(mockLead));

        mockMvc.perform(get("/api/leads/contatos")
                .header("X-EmpresaLocataria-Id", tenantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nome").value("Roberto Silva"))
                .andExpect(jsonPath("$[0].tabType").exists());
    }
}
