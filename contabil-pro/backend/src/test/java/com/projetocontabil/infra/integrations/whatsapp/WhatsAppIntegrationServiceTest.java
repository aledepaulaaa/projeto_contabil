package com.projetocontabil.infra.integrations.whatsapp;

import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.domain.crm.model.StatusLead;
import com.projetocontabil.core.domain.crm.vo.Telefone;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.infra.messaging.NotificationService;
import com.projetocontabil.infra.messaging.WhatsAppProducer;
import com.projetocontabil.infra.persistence.repository.MensagemChatJpaRepository;
import com.projetocontabil.core.ports.driven.EmpresaLocatariaRepository;
import com.projetocontabil.core.ports.driven.HistoricoVidaLeadRepository;
import com.projetocontabil.core.domain.empresalocataria.model.EmpresaLocataria;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.*;

class WhatsAppIntegrationServiceTest {

    @Mock
    private WhatsAppProducer whatsAppProducer;

    @Mock
    private MensagemChatJpaRepository mensagemRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private HistoricoVidaLeadRepository historicoRepository;
    
    @Mock
    private EmpresaLocatariaRepository empresaRepository;

    @Mock
    private com.projetocontabil.core.ports.driven.AutomacaoTemplateRepository templateRepository;

    private WhatsAppIntegrationService whatsAppIntegrationService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        whatsAppIntegrationService = new WhatsAppIntegrationService(whatsAppProducer, mensagemRepository, historicoRepository, notificationService, empresaRepository, templateRepository, null);
        
        // Mock padrão: Automação Ativa
        EmpresaLocataria empresaMock = mock(EmpresaLocataria.class);
        when(empresaMock.isWhatsappAutomacaoAtivo()).thenReturn(true);
        when(empresaRepository.findByEmpresaLocatariaId(any())).thenReturn(Optional.of(empresaMock));
    }

    @Test
    void deveEnviarMensagemParaFilaAoMudarParaProposta() {
        // Mock do Lead
        Lead lead = mock(Lead.class);
        UUID leadId = UUID.randomUUID();
        when(lead.getId()).thenReturn(leadId);
        when(lead.getNomeContato()).thenReturn("Testador");
        when(lead.getNomeEmpresa()).thenReturn("Empresa Teste");
        when(lead.getTelefone()).thenReturn(new Telefone("11999999999"));
        when(lead.getEmpresaLocatariaId()).thenReturn(EmpresaLocatariaId.of("tenant-test"));
        
        when(historicoRepository.findByLeadId(any())).thenReturn(Optional.empty());

        whatsAppIntegrationService.enviarNotificacaoStatus(lead, StatusLead.PROPOSTA);

        verify(whatsAppProducer, times(1)).enviarSolicitacao(
                eq(leadId), 
                eq("11999999999"), 
                anyString(), 
                eq("tenant-test")
        );
    }
}
