package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.crm.model.EventoHistoricoLead;
import com.projetocontabil.core.domain.crm.model.HistoricoVidaLead;
import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.ports.driven.AtendimentoRepository;
import com.projetocontabil.core.ports.driven.HistoricoVidaLeadRepository;
import com.projetocontabil.core.ports.driven.LeadRepository;
import com.projetocontabil.infra.messaging.NotificationService;
import com.projetocontabil.infra.persistence.entity.MensagemChatJpaEntity;
import com.projetocontabil.infra.persistence.repository.MensagemChatJpaRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

@RestController
@RequestMapping("/api/whatsapp/webhook")
@RequiredArgsConstructor
@Slf4j
public class WhatsAppWebhookController {

    private final LeadRepository leadRepository;
    private final HistoricoVidaLeadRepository historicoRepository;
    private final MensagemChatJpaRepository mensagemRepository;
    private final AtendimentoRepository atendimentoRepository;
    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<Void> receiveMessage(
            @RequestBody WebhookRequest request,
            @RequestHeader(value = "X-EmpresaLocataria-Id", required = false) String tenantId) {
        
        log.info("Webhook recebido: de={}, mensagem={}", request.getFrom(), request.getMessage());

        leadRepository.findByTelefone(request.getFrom()).ifPresentOrElse(
            lead -> processarMensagemLead(lead, request, tenantId),
            () -> {
                log.info("Mensagem recebida de número desconhecido: {}. Criando Lead Temporário.", request.getFrom());
                
                String safeTenantId = tenantId != null ? tenantId : "tenant-dev-mode";
                
                try {
                    com.projetocontabil.core.domain.crm.vo.Telefone telefone = new com.projetocontabil.core.domain.crm.vo.Telefone(request.getFrom());
                    Lead novoLead = Lead.criar(
                            new com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId(safeTenantId),
                            "Visitante (" + request.getFrom() + ")",
                            null,
                            telefone,
                            null,
                            "WhatsApp Webhook",
                            com.projetocontabil.core.domain.crm.model.OrigemLead.WHATSAPP,
                            null
                    );
                    
                    Lead leadSalvo = leadRepository.save(novoLead);
                    processarMensagemLead(leadSalvo, request, safeTenantId);
                    
                } catch (Exception e) {
                    log.error("Erro ao criar Lead Temporário para {}: {}", request.getFrom(), e.getMessage());
                }
            }
        );

        return ResponseEntity.ok().build();
    }

    private void processarMensagemLead(Lead lead, WebhookRequest request, String tenantId) {
        log.info("Processando mensagem para Lead: {} (ID: {})", lead.getNomeContato(), lead.getId());

        // 1. Salvar a mensagem no histórico de chat
        MensagemChatJpaEntity entity = new MensagemChatJpaEntity();
        entity.setId(UUID.randomUUID());
        entity.setLeadId(lead.getId());
        entity.setEmpresaLocatariaId(tenantId != null ? tenantId : lead.getEmpresaLocatariaId().value());
        entity.setConteudo(request.getMessage());
        entity.setRemetente("LEAD");
        entity.setEnviadoEm(LocalDateTime.ofInstant(
                Instant.ofEpochSecond(request.getTimestamp()), ZoneId.systemDefault()));
        
        // Vincular ao atendimento ativo se existir
        atendimentoRepository.findAtivoPorLead(lead.getId()).ifPresent(atend -> {
            entity.setAtendimentoId(atend.getId());
        });
        
        mensagemRepository.save(entity);

        // 2. Incrementar contador de mensagens não lidas e atualizar Timeline
        lead.incrementarMensagensNaoLidas();
        leadRepository.save(lead);

        registrarEventoTimeline(lead, "WHATSAPP_MESSAGE_RECEIVED", 
            "Nova mensagem recebida via WhatsApp: " + lead.getNomeContato());

        // 3. Notificar Frontend via WebSocket
        notificationService.notifyNewMessage(
                lead.getId().toString(), 
                request.getMessage(),
                "LEAD",
                request.getTimestamp());
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

    @PostMapping("/contacts/sync")
    public ResponseEntity<Void> syncContacts(@RequestHeader("X-EmpresaLocataria-Id") String tenantId) {
        log.info("[WhatsAppSync] Sincronização disparada para tenant: {}. Os contatos serão carregados sob demanda na listagem.", tenantId);
        // Em um cenário real, poderiamos disparar um job assíncrono aqui.
        // Para o MVP, a listagem de contatos fará o fetch em tempo real do Whapi.
        return ResponseEntity.ok().build();
    }

    @Data
    public static class WebhookRequest {
        private String from;
        private String message;
        private long timestamp;
    }
}
