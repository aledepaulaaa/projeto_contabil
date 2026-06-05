package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.usecases.crm.EfetivarAssinaturaUseCase;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller responsável por receber webhooks da ZapSign.
 * Endpoints públicos, sem necessidade de autenticação por token interno.
 */
@RestController
@RequestMapping("/api/webhooks/zapsign")
@RequiredArgsConstructor
@Slf4j
public class ZapSignWebhookController {

    private final EfetivarAssinaturaUseCase efetivarAssinaturaUseCase;
    private final com.projetocontabil.infra.integrations.zapsign.ZapSignProperties zapsignProps;
    private final com.projetocontabil.infra.integrations.zapsign.ZapSignIntegration zapSignIntegration;

    @PostMapping("/configurar")
    public ResponseEntity<Map<String, String>> configurarWebhook(@RequestBody Map<String, String> request) {
        String url = request.get("url");
        if (url == null || url.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "URL é obrigatória"));
        }

        try {
            zapsignProps.setWebhookUrl(url); // Atualiza para uso em novos documentos
            String webhookId = zapSignIntegration.registerWebhook(url, "doc_signed");
            return ResponseEntity.ok(Map.of(
                "mensagem", "Webhook configurado com sucesso via API!",
                "webhook_id", webhookId
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("erro", e.getMessage()));
        }
    }

    @GetMapping("/listar")
    public ResponseEntity<List<Map<String, Object>>> listarWebhooks() {
        return ResponseEntity.ok(zapSignIntegration.listarWebhooks());
    }

    @GetMapping
    public ResponseEntity<String> testarConectividade() {
        log.info("🌐 [WEBHOOK ZapSign] Teste de conectividade GET recebido!");
        return ResponseEntity.ok("Backend Projeto Contábil está ONLINE e acessível via ngrok!");
    }

    @PostMapping
    public ResponseEntity<Void> receberWebhook(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "ngrok-skip-browser-warning", required = false) String ngrokHeader,
            @RequestBody String rawBody) {
        
        log.info("🔥 [WEBHOOK ZapSign] CHAMADA DETECTADA! Header Auth: {}, Body: {}", 
                 authHeader != null, rawBody);
        
        // Converter manualmente para o objeto (ou apenas logar por enquanto)
        ZapSignWebhookPayload payload;
        try {
            payload = new com.fasterxml.jackson.databind.ObjectMapper().readValue(rawBody, ZapSignWebhookPayload.class);
        } catch (Exception e) {
            log.error("❌ [WEBHOOK ZapSign] Erro ao converter payload: {}", e.getMessage());
            return ResponseEntity.ok().build(); // Retorna 200 para ZapSign parar de tentar
        }

        // Validação de Segurança (Opcional, mas recomendada pela documentação)
        if (zapsignProps.getApiToken() != null && !zapsignProps.getApiToken().isBlank()) {
            String expected = "Bearer " + zapsignProps.getApiToken();
            if (authHeader == null || !authHeader.equals(expected)) {
                log.warn("[WEBHOOK ZapSign] Tentativa de acesso sem token válido no header Authorization.");
                // return ResponseEntity.status(401).build(); // Descomentar após validar que a ZapSign envia o header corretamente
            }
        }

        try {
            // O evento "doc_signed" ou "signed" indica que o documento foi totalmente assinado
            if ("doc_signed".equalsIgnoreCase(payload.getEventType()) || "signed".equalsIgnoreCase(payload.getEventType())) {
                
                if (payload.getDocument() != null && payload.getDocument().getExternalId() != null) {
                    UUID contratoId = UUID.fromString(payload.getDocument().getExternalId());
                    
                    log.info("[WEBHOOK ZapSign] Documento totalmente assinado! Contrato ID: {}", contratoId);
                    efetivarAssinaturaUseCase.executar(contratoId);
                } else {
                    log.warn("[WEBHOOK ZapSign] Documento assinado, mas sem external_id. Impossível vincular.");
                }
            } else {
                log.debug("[WEBHOOK ZapSign] Evento {} ignorado.", payload.getEventType());
            }

            return ResponseEntity.ok().build();

        } catch (IllegalArgumentException e) {
            log.error("[WEBHOOK ZapSign] Erro de validação: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("[WEBHOOK ZapSign] Falha ao processar webhook: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @Data
    public static class ZapSignWebhookPayload {
        private String event_type;
        private DocumentPayload document;

        public String getEventType() {
            return event_type;
        }
    }

    @Data
    public static class DocumentPayload {
        private String external_id;
        private String token;
        private String name;
        private String status;
        
        public String getExternalId() {
            return external_id;
        }
    }
}
