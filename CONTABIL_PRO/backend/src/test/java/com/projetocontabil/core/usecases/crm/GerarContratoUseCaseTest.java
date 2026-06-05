package com.projetocontabil.core.usecases.crm;

import com.projetocontabil.core.domain.crm.model.*;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.ContratoRepository;
import com.projetocontabil.core.ports.driven.HistoricoVidaLeadRepository;
import com.projetocontabil.core.ports.driven.SignatureGateway;
import com.projetocontabil.infra.messaging.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;


import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("GerarContratoUseCase — Geração Assíncrona de Contrato via ZapSign")
class GerarContratoUseCaseTest {

    @Mock private ContratoRepository contratoRepository;
    @Mock private HistoricoVidaLeadRepository historicoRepository;
    @Mock private SignatureGateway signatureGateway;
    @Mock private NotificationService notificationService;
    @Mock private ContratoTemplateService templateService;

    private GerarContratoUseCase useCase;

    @BeforeEach
    void setUp() {
        useCase = new GerarContratoUseCase(
                contratoRepository, historicoRepository, signatureGateway, notificationService, templateService, null, null, null);
    }

    @Test
    @DisplayName("Deve gerar contrato, chamar ZapSign e notificar via WebSocket")
    void deveGerarContratoComSucesso() {
        UUID leadId = UUID.randomUUID();
        String empresaId = "tenant-test";
        String nome = "João";
        String email = "joao@test.com";

        // Template retorna HTML
        when(templateService.gerarHtmlContrato(any())).thenReturn("<html>contrato</html>");

        // ZapSign retorna URL do documento
        when(signatureGateway.createDocumentOneClick(
                any(), any(), any(), any(), any()))
                .thenReturn("https://app.zapsign.com.br/verificar/oneclick/mock-123");

        // Contrato.save retorna o contrato recebido
        when(contratoRepository.save(any(Contrato.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // Histórico existe
        var historico = HistoricoVidaLead.criar(leadId, EmpresaLocatariaId.of(empresaId));
        when(historicoRepository.findByLeadId(leadId)).thenReturn(Optional.of(historico));

        // Executa
        useCase.executar(leadId, empresaId, nome, email);

        // Verifica que o contrato foi salvo 2 vezes (GERANDO + AGUARDANDO_ASSINATURA)
        ArgumentCaptor<Contrato> captor = ArgumentCaptor.forClass(Contrato.class);
        verify(contratoRepository, times(2)).save(captor.capture());

        var contratoFinal = captor.getAllValues().get(1);
        assertEquals(StatusContrato.AGUARDANDO_ASSINATURA, contratoFinal.getStatus());
        assertEquals("https://app.zapsign.com.br/verificar/oneclick/mock-123", contratoFinal.getUrlDocumentoZapSign());

        // Verifica notificação WebSocket
        verify(notificationService).notifyContratoDisponivel(eq(empresaId), eq(nome), any());

        // Verifica histórico registrado
        verify(historicoRepository).save(any());
    }

    @Test
    @DisplayName("Deve tratar falha do ZapSign sem quebrar o fluxo")
    void deveTratarFalhaZapSign() {
        UUID leadId = UUID.randomUUID();

        when(templateService.gerarHtmlContrato(any())).thenReturn("<html>contrato</html>");

        when(signatureGateway.createDocumentOneClick(any(), any(), any(), any(), any()))
                .thenThrow(new RuntimeException("ZapSign offline"));

        var historico = HistoricoVidaLead.criar(leadId, EmpresaLocatariaId.of("tenant-test"));
        when(historicoRepository.findByLeadId(leadId)).thenReturn(Optional.of(historico));

        // Não deve lançar exceção — deve ser resiliente
        assertDoesNotThrow(() ->
                useCase.executar(leadId, "tenant-test", "Falha", "falha@test.com"));

        // Contrato foi salvo pelo menos uma vez (GERANDO)
        verify(contratoRepository, atLeastOnce()).save(any());
    }
}
