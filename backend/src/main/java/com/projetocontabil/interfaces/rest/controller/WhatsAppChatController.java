package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.ports.driven.LeadRepository;
import com.projetocontabil.infra.integrations.whatsapp.WhatsAppIntegrationService;
import com.projetocontabil.infra.persistence.entity.MensagemChatJpaEntity;
import com.projetocontabil.infra.persistence.repository.MensagemChatJpaRepository;
import com.projetocontabil.infra.messaging.WhatsAppProducer;
import com.projetocontabil.infra.messaging.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.Map;

@RestController
@RequestMapping("/api/whatsapp/chat")
@RequiredArgsConstructor
@Slf4j
public class WhatsAppChatController {

    private final MensagemChatJpaRepository mensagemRepository;
    private final WhatsAppProducer whatsAppProducer;
    private final LeadRepository leadRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    @GetMapping("/{leadId}")
    public ResponseEntity<List<MensagemChatJpaEntity>> listarMensagens(
            @PathVariable String leadId,
            @RequestHeader(value = "X-EmpresaLocataria-Id", required = false) String tenantId,
            HttpServletRequest request) {
        
        log.info("[WhatsAppChat] Listando mensagens para lead: {}", leadId);
        
        try {
            UUID uuid;
            try {
                uuid = UUID.fromString(leadId);
            } catch (IllegalArgumentException e) {
                // Fallback: Buscar leadId pelo telefone
                log.info("[WhatsAppChat] leadId não é UUID, buscando por telefone: {}", leadId);
                uuid = leadRepository.findByTelefone(leadId)
                        .map(Lead::getId)
                        .orElseThrow(() -> new IllegalArgumentException("Lead não localizado por telefone: " + leadId));
            }
            
            List<MensagemChatJpaEntity> mensagens = mensagemRepository.findAllByLeadIdOrderByEnviadoEmAsc(uuid);
            
            // Filtro de Privacidade (Admin Exclusive)
            String userRole = request.getHeader("X-User-Role");
            if (!"ADMIN".equalsIgnoreCase(userRole)) {
                mensagens = mensagens.stream()
                        .filter(m -> !Boolean.TRUE.equals(m.getRestritoAdmin()))
                        .toList();
            }
            
            return ResponseEntity.ok(mensagens);
        } catch (IllegalArgumentException e) {
            log.warn("[WhatsAppChat] Erro ao localizar lead: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("[WhatsAppChat] Erro crítico ao listar mensagens para {}: {}", leadId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{leadId}/send")
    public ResponseEntity<MensagemChatJpaEntity> enviarMensagem(
            @PathVariable String leadId,
            @RequestBody Map<String, Object> payload,
            @RequestHeader("X-EmpresaLocataria-Id") String tenantId) {
        
        String conteudo = (String) payload.get("conteudo");
        String tipo = (String) payload.getOrDefault("tipo", "MANUAL"); // MANUAL ou INTERNA
        
        log.info("[WhatsAppChat] Enviando mensagem de tipo {} para lead: {}", tipo, leadId);

        try {
            UUID leadUuid;
            try {
                leadUuid = UUID.fromString(leadId);
            } catch (IllegalArgumentException e) {
                leadUuid = leadRepository.findByTelefone(leadId)
                        .map(Lead::getId)
                        .orElseThrow(() -> new IllegalArgumentException("Lead não localizado por telefone no envio: " + leadId));
            }

            final UUID finalLeadUuid = leadUuid;
            Lead lead = leadRepository.findById(leadUuid)
                    .orElseThrow(() -> new RuntimeException("Lead não encontrado: " + finalLeadUuid));

            // 1. Persistir no Banco
            MensagemChatJpaEntity entity = new MensagemChatJpaEntity();
            entity.setId(UUID.randomUUID());
            entity.setLeadId(leadUuid);
            entity.setEmpresaLocatariaId(tenantId);
            entity.setConteudo(conteudo);
            entity.setRemetente("CONSULTOR");
            entity.setEnviadoEm(LocalDateTime.now());
            entity.setTipo(tipo);
            MensagemChatJpaEntity salva = mensagemRepository.save(entity);

            // 2. Enviar via WhatsApp (se não for nota interna)
            if (!"INTERNA".equals(tipo)) {
                String telefone = lead.getTelefone().value();
                whatsAppProducer.enviarSolicitacao(leadUuid, telefone, conteudo, tenantId);
            }

            // 3. Notificar via WebSocket para atualização em tempo real
            notificationService.notifyNewMessage(
                leadId, 
                conteudo, 
                "CONSULTOR", 
                System.currentTimeMillis() / 1000
            );

            return ResponseEntity.ok(salva);
        } catch (IllegalArgumentException e) {
            log.warn("[WhatsAppChat] leadId inválido no envio: {}", leadId);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("[WhatsAppChat] Erro ao enviar mensagem para {}: {}", leadId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
