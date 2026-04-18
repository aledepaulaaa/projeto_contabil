package com.projetocontabil.infra.integrations.whatsapp;

import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.domain.crm.model.StatusLead;
import com.projetocontabil.core.domain.crm.model.EventoHistoricoLead;
import com.projetocontabil.core.domain.crm.model.HistoricoVidaLead;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.domain.empresalocataria.model.EmpresaLocataria;
import com.projetocontabil.core.ports.driven.EmpresaLocatariaRepository;
import com.projetocontabil.core.ports.driven.HistoricoVidaLeadRepository;
import com.projetocontabil.infra.messaging.NotificationService;
import com.projetocontabil.infra.persistence.entity.MensagemChatJpaEntity;
import com.projetocontabil.infra.persistence.repository.MensagemChatJpaRepository;
import com.projetocontabil.infra.messaging.WhatsAppProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsAppIntegrationService {

    private final WhatsAppProducer whatsAppProducer;
    private final MensagemChatJpaRepository mensagemRepository;
    private final HistoricoVidaLeadRepository historicoRepository;
    private final NotificationService notificationService;
    private final EmpresaLocatariaRepository empresaRepository;

    /**
     * Envia notificação automática baseada na mudança de status do Lead.
     */
    @Async
    public void enviarNotificacaoStatus(Lead lead, StatusLead status) {
        log.info("Iniciando processo de notificação automática para Lead: {} (Status: {})", lead.getNomeContato(), status);
        
        String mensagem = gerarMensagemParaStatus(lead, status);
        if (mensagem == null) {
            log.debug("A mudança para o status {} não possui mensagem automática configurada.", status);
            return;
        }

        // Verificar se Automação está Ativa para a Empresa
        EmpresaLocatariaId empresaId = lead.getEmpresaLocatariaId();
        EmpresaLocataria empresa = empresaRepository.findByEmpresaLocatariaId(empresaId)
                .orElse(null);

        if (empresa != null && !empresa.isWhatsappAutomacaoAtivo()) {
            log.info("Automação de WhatsApp desativada para a empresa {}. Ignorando disparo.", empresa.getNome());
            return;
        }

        // Busca o telefone real do Lead
        if (lead.getTelefone() == null || lead.getTelefone().value() == null) {
            log.error("ABORTANDO: Lead {} (ID: {}) não possui telefone cadastrado no domínio.", lead.getNomeContato(), lead.getId());
            return;
        }
        
        String telefone = lead.getTelefone().value();
        log.info("Confirmado telefone {} para o lead {}. Preparando requisição para Producer.", telefone, lead.getNomeContato());

        try {
            log.info("Encaminhando notificação de status [{}] para fila RabbitMQ. Lead: {}", status, lead.getNomeContato());
            
            whatsAppProducer.enviarSolicitacao(
                    lead.getId(),
                    telefone,
                    mensagem,
                    lead.getEmpresaLocatariaId().value()
            );
            
            // Salvar no histórico de chat
            MensagemChatJpaEntity entity = new MensagemChatJpaEntity();
            entity.setId(UUID.randomUUID());
            entity.setLeadId(lead.getId());
            entity.setEmpresaLocatariaId(lead.getEmpresaLocatariaId().value());
            entity.setConteudo(mensagem);
            entity.setRemetente("CONSULTOR");
            entity.setEnviadoEm(LocalDateTime.now());
            mensagemRepository.save(entity);

            // Notificar via WebSocket
            notificationService.notifyNewMessage(
                lead.getId().toString(), 
                mensagem, 
                "CONSULTOR", 
                System.currentTimeMillis() / 1000);

            // Registrar na Timeline
            registrarEventoTimeline(lead, "WHATSAPP_MESSAGE_SENT", 
                "Notificação automática enviada via WhatsApp (Status: " + status + ")");
                
        } catch (Exception e) {
            log.error("FALHA CRÍTICA ao disparar WhatsApp automático para {}: {} - {}", 
                lead.getNomeContato(), e.getClass().getSimpleName(), e.getMessage());
        }
    }

    private void registrarEventoTimeline(Lead lead, String tipo, String descricao) {
        try {
            var historico = historicoRepository.findByLeadId(lead.getId())
                    .orElse(HistoricoVidaLead.criar(lead.getId(), lead.getEmpresaLocatariaId()));
            
            historico.registrarEvento(tipo, descricao, EventoHistoricoLead.MarcadorEvento.NEUTRO);
            
            historicoRepository.save(historico);
        } catch (Exception e) {
            log.error("Erro ao registrar evento na timeline do lead {}: {}", lead.getId(), e.getMessage());
        }
    }

    private String gerarMensagemParaStatus(Lead lead, StatusLead status) {
        return switch (status) {
            case PROPOSTA -> String.format(
                "Olá %s! 👋 Acabamos de enviar a proposta da %s para o seu e-mail. Vamos conversar sobre os próximos passos?",
                lead.getNomeContato(), lead.getNomeEmpresa());
            
            case AGUARDANDO -> String.format(
                "Olá %s, estamos aguardando sua aprovação para seguirmos com o processo da %s. Alguma dúvida?",
                lead.getNomeContato(), lead.getNomeEmpresa());
                
            case FECHAMENTO -> String.format(
                "Parabéns %s! 🎉 Chegamos na etapa final. O contrato da %s foi enviado para assinatura via ZapSign.",
                lead.getNomeContato(), lead.getNomeEmpresa());
                
            default -> null;
        };
    }
}
