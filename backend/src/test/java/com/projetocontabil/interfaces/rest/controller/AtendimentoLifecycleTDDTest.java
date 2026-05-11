package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.domain.crm.model.StatusLead;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.domain.usuario.model.Usuario;
import com.projetocontabil.core.ports.driven.*;
import com.projetocontabil.core.usecases.crm.FinalizarOnboardingUseCase;
import com.projetocontabil.core.usecases.crm.HistoricoExportService;
import com.projetocontabil.core.usecases.crm.ImportarLeadsUseCase;
import com.projetocontabil.infra.messaging.ContratoProducer;
import com.projetocontabil.infra.messaging.NotificationService;
import com.projetocontabil.infra.integrations.whatsapp.WhatsAppIntegrationService;
import com.projetocontabil.infra.integrations.email.EmailIntegrationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AtendimentoLifecycleTDDTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean private LeadRepository leadRepository;
    @MockitoBean private AtendimentoRepository atendimentoRepository;
    @MockitoBean private DepartamentoRepository departamentoRepository;
    @MockitoBean private UsuarioRepository usuarioRepository;
    
    @MockitoBean private ContratoRepository contratoRepository;
    @MockitoBean private HistoricoVidaLeadRepository historicoRepository;
    @MockitoBean private FinalizarOnboardingUseCase finalizarOnboardingUseCase;
    @MockitoBean private ImportarLeadsUseCase importarLeadsUseCase;
    @MockitoBean private HistoricoExportService exportService;
    @MockitoBean private AuditoriaRepository auditoriaRepository;
    @MockitoBean private ContratoProducer contratoProducer;
    @MockitoBean private WhatsAppIntegrationService whatsAppService;
    @MockitoBean private EmailIntegrationService emailService;
    @MockitoBean private NotificationService notificationService;
    @MockitoBean private RestTemplate restTemplate;
    @MockitoBean private org.springframework.mail.javamail.JavaMailSender mailSender;
    @MockitoBean private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    private static final UUID ADMIN_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Test
    @WithMockUser(username = "11111111-1111-1111-1111-111111111111")
    void leadEmPropostaSemAtendimentoNaoDeveEstarNaAbasFila() throws Exception {
        UUID leadId = UUID.randomUUID();
        EmpresaLocatariaId tenant = EmpresaLocatariaId.of("tenant-123");

        // Mock: Admin user via SecurityContext + UsuarioRepository
        when(usuarioRepository.findById(ADMIN_ID))
            .thenReturn(Optional.of(Usuario.reconstituirCompleto(
                ADMIN_ID, "tenant-123", "admin@test.com", "admin@test.com",
                "hash", "Admin", "ADMIN", true,
                com.projetocontabil.core.domain.usuario.model.Papel.ADMIN,
                null, null, null)));
        when(departamentoRepository.findAllByEmpresaLocatariaId(tenant)).thenReturn(Collections.emptyList());
        
        // Lead em PROPOSTA mas sem registro de atendimento
        Lead lead = Lead.reconstituir(
            leadId, tenant, "Raissa", null, null, null, "Bolivar CORP", 
            StatusLead.PROPOSTA, null, null, null, null, null, 
            LocalDateTime.now().minusDays(2), 0, false, null
        );
        
        when(leadRepository.findAllByEmpresaLocatariaId(any())).thenReturn(List.of(lead));
        when(atendimentoRepository.findAllAtivosByEmpresa(anyString())).thenReturn(List.of());
        when(atendimentoRepository.findAtivoPorLead(leadId)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/leads/contatos")
                .header("X-EmpresaLocataria-Id", tenant.value()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tabType").value("contatos"))
                .andExpect(jsonPath("$[0].espera").doesNotExist());
    }

    @Test
    @WithMockUser(username = "11111111-1111-1111-1111-111111111111")
    void leadEmPropostaComAtendimentoAguardandoDeveEstarNaFila() throws Exception {
        UUID leadId = UUID.randomUUID();
        EmpresaLocatariaId tenant = EmpresaLocatariaId.of("tenant-123");
        LocalDateTime waitStart = LocalDateTime.now().minusMinutes(5);

        // Mock: Admin user via SecurityContext + UsuarioRepository
        when(usuarioRepository.findById(ADMIN_ID))
            .thenReturn(Optional.of(Usuario.reconstituirCompleto(
                ADMIN_ID, "tenant-123", "admin@test.com", "admin@test.com",
                "hash", "Admin", "ADMIN", true,
                com.projetocontabil.core.domain.usuario.model.Papel.ADMIN,
                null, null, null)));
        when(departamentoRepository.findAllByEmpresaLocatariaId(tenant)).thenReturn(Collections.emptyList());
        
        Lead lead = Lead.reconstituir(
            leadId, tenant, "Raissa", null, null, null, "Bolivar CORP", 
            StatusLead.PROPOSTA, null, null, null, null, null, 
            LocalDateTime.now().minusDays(2), 0, false, null
        );
        
        com.projetocontabil.core.domain.atendimento.model.Atendimento atend = 
            com.projetocontabil.core.domain.atendimento.model.Atendimento.reconstituir(
                UUID.randomUUID(), tenant.value(), leadId, null, null, 
                com.projetocontabil.core.domain.atendimento.model.StatusAtendimento.AGUARDANDO,
                waitStart, null, null, waitStart, false, false
            );
        
        when(leadRepository.findAllByEmpresaLocatariaId(any())).thenReturn(List.of(lead));
        when(atendimentoRepository.findAllAtivosByEmpresa(anyString())).thenReturn(List.of(atend));
        when(atendimentoRepository.findAtivoPorLead(leadId)).thenReturn(Optional.of(atend));

        mockMvc.perform(get("/api/leads/contatos")
                .header("X-EmpresaLocataria-Id", tenant.value()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tabType").value("fila"))
                .andExpect(jsonPath("$[0].espera").value(waitStart.toString()));
    }
}
