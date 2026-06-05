package com.projetocontabil.infra.integrations.whatsapp;

import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.domain.crm.model.StatusLead;
import com.projetocontabil.core.domain.crm.model.EventoHistoricoLead;
import com.projetocontabil.core.domain.crm.model.HistoricoVidaLead;
import com.projetocontabil.core.domain.crm.model.AutomacaoTemplate;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.domain.empresalocataria.model.EmpresaLocataria;
import com.projetocontabil.core.ports.driven.AutomacaoTemplateRepository;
import com.projetocontabil.core.ports.driven.ContratoRepository;
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
import java.util.Optional;
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
    private final AutomacaoTemplateRepository templateRepository;
    private final ContratoRepository contratoRepository;

    /**
     * Envia notificação automática baseada na mudança de status do Lead.
     */
    @Async
    public void enviarNotificacaoStatus(Lead lead, StatusLead status) {
        enviarNotificacaoStatus(lead, status, null);
    }

    @Async
    public void enviarNotificacaoStatus(Lead lead, StatusLead status, String customUrl) {
        log.info("Iniciando processo de notificação automática para Lead: {} (Status: {})", lead.getNomeContato(), status);
        
        String mensagem = gerarMensagemParaStatus(lead, status, customUrl);
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

    private String gerarMensagemParaStatus(Lead lead, StatusLead status, String customUrl) {
        String mensagem = obterMensagemDoTemplate(lead, status);
        if (mensagem == null) return null;

        return formatarVariaveis(mensagem, lead, customUrl);
    }

    private String obterMensagemDoTemplate(Lead lead, StatusLead status) {
        Optional<AutomacaoTemplate> templateOpt = templateRepository.findByEmpresaAndGatilho(lead.getEmpresaLocatariaId(), status);
        
        if (templateOpt.isPresent()) {
            return templateOpt.get().getTexto();
        }

        // Fallbacks caso não exista template configurado
        return switch (status) {
            case PROPOSTA -> "Olá {nome}! 👋 Acabamos de gerar o contrato da {empresa}. Enviamos o link oficial para o seu e-mail e você também pode assinar por aqui via ZapSign: {link_zapsign} Vamos dar esse passo?";
            case AGUARDANDO -> "Olá {nome}, estamos aguardando a assinatura do contrato da {empresa} para iniciarmos sua implantação. Alguma dúvida sobre as cláusulas?";
            case FECHAMENTO -> "Parabéns {nome}! 🎉 O contrato da {empresa} foi assinado com sucesso. Seja bem-vindo(a)! Nossa equipe de implantação entrará em contato em breve!";
            default -> null;
        };
    }

    private String formatarVariaveis(String texto, Lead lead, String customUrl) {
        String urlZapsign = customUrl != null ? customUrl : "Link não disponível";
        
        if (customUrl == null) {
            try {
                var contratoOpt = contratoRepository.findByLeadId(lead.getId());
                if (contratoOpt.isPresent() && contratoOpt.get().getUrlDocumentoZapSign() != null) {
                    urlZapsign = contratoOpt.get().getUrlDocumentoZapSign();
                }
            } catch (Exception e) {
                log.warn("Falha ao buscar URL do contrato para formatação de WhatsApp do lead {}: {}", lead.getId(), e.getMessage());
            }
        }

        return texto
            .replace("{nome}", lead.getNomeContato() != null ? lead.getNomeContato() : "")
            .replace("{empresa}", lead.getNomeEmpresa() != null ? lead.getNomeEmpresa() : "")
            .replace("{link_documento}", urlZapsign)
            .replace("{link_zapsign}", urlZapsign);
    }
}
