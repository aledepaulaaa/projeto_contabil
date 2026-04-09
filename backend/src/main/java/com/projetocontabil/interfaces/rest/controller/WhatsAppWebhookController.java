package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.crm.model.EventoHistoricoLead;
import com.projetocontabil.core.domain.crm.model.HistoricoVidaLead;
import com.projetocontabil.core.domain.crm.model.Lead;
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
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/whatsapp/webhook")
@RequiredArgsConstructor
@Slf4j
public class WhatsAppWebhookController {

    private final LeadRepository leadRepository;
    private final HistoricoVidaLeadRepository historicoRepository;
    private final MensagemChatJpaRepository mensagemRepository;
    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<Void> receiveMessage(
            @RequestBody WebhookRequest request,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId) {
        
        log.info("Webhook recebido: de={}, mensagem={}", request.getFrom(), request.getMessage());

        // Localizar Lead pelo telefone
        leadRepository.findByTelefone(request.getFrom()).ifPresentOrElse(lead -> {
            log.info("Lead localizado: {} (ID: {})", lead.getNomeContato(), lead.getId());

            // 1. Salvar a mensagem no histórico de chat
            MensagemChatJpaEntity entity = new MensagemChatJpaEntity();
            entity.setId(UUID.randomUUID());
            entity.setLeadId(lead.getId());
            entity.setEmpresaLocatariaId(tenantId != null ? tenantId : lead.getEmpresaLocatariaId().value());
            entity.setConteudo(request.getMessage());
            entity.setRemetente("LEAD");
            entity.setEnviadoEm(LocalDateTime.ofInstant(
                    Instant.ofEpochSecond(request.getTimestamp()), ZoneId.systemDefault()));
            
            mensagemRepository.save(entity);

            // 2. Etapa 4: Incrementar contador de mensagens não lidas e atualizar Timeline
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

        }, () -> {
            log.warn("Mensagem recebida de número desconhecido: {}", request.getFrom());
        });

        return ResponseEntity.ok().build();
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

    @GetMapping("/{leadId}")
    public ResponseEntity<List<MensagemChatJpaEntity>> listarMensagens(@PathVariable UUID leadId) {
        return ResponseEntity.ok(mensagemRepository.findAllByLeadIdOrderByEnviadoEmAsc(leadId));
    }

    @Data
    public static class WebhookRequest {
        private String from;
        private String message;
        private long timestamp;
    }
}
