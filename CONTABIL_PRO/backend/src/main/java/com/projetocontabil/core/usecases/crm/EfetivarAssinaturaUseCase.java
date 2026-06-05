package com.projetocontabil.core.usecases.crm;

import com.projetocontabil.core.domain.crm.model.Contrato;
import com.projetocontabil.core.domain.crm.model.EventoHistoricoLead;
import com.projetocontabil.core.domain.crm.model.HistoricoVidaLead;
import com.projetocontabil.core.domain.crm.model.StatusLead;
import com.projetocontabil.core.ports.driven.ContratoRepository;
import com.projetocontabil.core.ports.driven.HistoricoVidaLeadRepository;
import com.projetocontabil.core.ports.driven.LeadRepository;
import com.projetocontabil.core.usecases.onboarding.IniciarOnboardingUseCase;
import com.projetocontabil.infra.integrations.email.EmailIntegrationService;
import com.projetocontabil.infra.integrations.whatsapp.WhatsAppIntegrationService;
import com.projetocontabil.infra.messaging.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * UseCase disparado pelo Webhook da ZapSign quando um contrato é assinado.
 * Transita o Contrato para ATIVO e o Lead para FECHAMENTO.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EfetivarAssinaturaUseCase {

    private final ContratoRepository contratoRepository;
    private final LeadRepository leadRepository;
    private final HistoricoVidaLeadRepository historicoRepository;
    private final IniciarOnboardingUseCase iniciarOnboardingUseCase;
    private final WhatsAppIntegrationService whatsAppService;
    private final EmailIntegrationService emailService;
    private final NotificationService notificationService;

    @Transactional
    public void executar(UUID contratoId) {
        log.info("[WEBHOOK ZapSign] Iniciando efetivação de assinatura para o contrato {}", contratoId);

        Contrato contrato = contratoRepository.findById(contratoId)
                .orElseThrow(() -> new IllegalArgumentException("Contrato não encontrado: " + contratoId));

        log.info("[WEBHOOK ZapSign] Contrato encontrado: {} | Status Atual: {} | Lead ID: {}", 
                 contratoId, contrato.getStatus(), contrato.getLeadId());

        // 1. Ativar o Contrato
        if (contrato.getStatus() == com.projetocontabil.core.domain.crm.model.StatusContrato.AGUARDANDO_ASSINATURA) {
            contrato.ativar();
            contratoRepository.save(contrato);
            log.info("[WEBHOOK ZapSign] Contrato {} ativado com sucesso.", contratoId);
        } else if (contrato.getStatus() == com.projetocontabil.core.domain.crm.model.StatusContrato.ATIVO) {
            log.warn("[WEBHOOK ZapSign] Contrato {} já estava ATIVO. Ignorando processo duplicado.", contratoId);
            return;
        } else {
            log.error("[WEBHOOK ZapSign] Contrato {} em estado inválido para ativação: {}", contratoId, contrato.getStatus());
            throw new IllegalStateException("Contrato não está em estado válido para assinatura: " + contrato.getStatus());
        }

        // 2. Mudar status do Lead para FECHAMENTO
        leadRepository.findById(contrato.getLeadId()).ifPresentOrElse(lead -> {
            log.info("[WEBHOOK ZapSign] Lead encontrado: {} | Status Atual: {}", lead.getNomeContato(), lead.getStatus());
            log.info("[WEBHOOK ZapSign] Transicionando Lead {} para FECHAMENTO", lead.getNomeContato());
            
            // Só mudamos para FECHAMENTO se ele não estiver já fechado.
            if (lead.getStatus() != StatusLead.FECHAMENTO) {
                lead.mudarStatus(StatusLead.FECHAMENTO);
                leadRepository.save(lead);

                // 3. Registrar no histórico de vida
                var historico = historicoRepository.findByLeadId(lead.getId())
                        .orElse(HistoricoVidaLead.criar(lead.getId(), lead.getEmpresaLocatariaId()));
                
                historico.registrarEvento("ASSINATURA_CONCLUIDA", 
                    "O contrato digital foi assinado com sucesso via ZapSign. Lead movido para FECHAMENTO.", 
                    EventoHistoricoLead.MarcadorEvento.SUCESSO);
                historicoRepository.save(historico);

                // 4. Iniciar Onboarding
                log.info("[WEBHOOK ZapSign] Disparando criação de Onboarding para Lead {}", lead.getNomeContato());
                iniciarOnboardingUseCase.executar(lead);

                // 5. Disparos Automáticos de FECHAMENTO (WhatsApp e E-mail)
                log.info("[WEBHOOK ZapSign] Disparando Automações de Boas Vindas para {}", lead.getNomeContato());
                whatsAppService.enviarNotificacaoStatus(lead, StatusLead.FECHAMENTO);
                emailService.enviarNotificacaoStatus(lead, StatusLead.FECHAMENTO);

                // 6. Notificar Front-end para atualização
                notificationService.notifyReloadContacts(lead.getEmpresaLocatariaId().value());
            }
        }, () -> log.error("[WEBHOOK ZapSign] Lead {} vinculado ao contrato {} não foi encontrado!", contrato.getLeadId(), contratoId));
    }
}
