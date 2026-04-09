package com.projetocontabil.infra.messaging;

import com.projetocontabil.infra.config.RabbitMQConfig;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

/**
 * Produtor de mensagens para a fila de E-mail (RabbitMQ).
 * Desacopla o envio de e-mails do fluxo síncrono.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailProducer {

    private final RabbitTemplate rabbitTemplate;

    /**
     * Envia uma solicitação de disparo de e-mail para a fila.
     */
    public void enviarEmail(String para, String assunto, String corpo, String tenantId) {
        var payload = EmailPayload.builder()
                .para(para)
                .assunto(assunto)
                .corpo(corpo)
                .tenantId(tenantId)
                .timestamp(System.currentTimeMillis())
                .build();

        log.info("Encaminhando e-mail via RabbitMQ para {}. Queue: {}", para, RabbitMQConfig.EMAIL_QUEUE);
        
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.CONTRATO_EXCHANGE, 
                RabbitMQConfig.EMAIL_ROUTING_KEY, 
                payload
        );
    }

    @Data
    @Builder
    public static class EmailPayload {
        private String para;
        private String assunto;
        private String corpo;
        private String tenantId;
        private long timestamp;
    }
}
