package com.projetocontabil.infra.messaging;

import com.projetocontabil.infra.config.RabbitMQConfig;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Produtor de mensagens para a fila do WhatsApp (RabbitMQ).
 * Desacopla o envio de mensagens do fluxo síncrono do CRM.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsAppProducer {

    private final RabbitTemplate rabbitTemplate;

    /**
     * Envia uma solicitação de disparo para a fila.
     */
    public void enviarSolicitacao(UUID leadId, String numero, String mensagem, String tenantId) {
        var payload = WhatsAppPayload.builder()
                .leadId(leadId)
                .numero(numero)
                .mensagem(mensagem)
                .tenantId(tenantId)
                .timestamp(System.currentTimeMillis())
                .build();

        log.info("Encaminhando mensagem via RabbitMQ para {}. Queue: {}", numero, RabbitMQConfig.WHATSAPP_QUEUE);
        
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.CONTRATO_EXCHANGE, 
                RabbitMQConfig.WHATSAPP_ROUTING_KEY, 
                payload
        );
    }

    @Data
    @Builder
    public static class WhatsAppPayload {
        private UUID leadId;
        private String numero;
        private String mensagem;
        private String tenantId;
        private long timestamp;
    }
}
