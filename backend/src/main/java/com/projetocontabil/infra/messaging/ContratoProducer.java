package com.projetocontabil.infra.messaging;

import com.projetocontabil.infra.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;


import java.util.Map;

/**
 * Producer que envia mensagens na fila do RabbitMQ para geração assíncrona de contratos.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ContratoProducer {

    private final RabbitTemplate rabbitTemplate;

    /**
     * Envia uma mensagem para a fila de geração de contratos.
     */
    public void enviarParaGeracaoDeContrato(String leadId, String empresaLocatariaId, String nomeContato, String emailContato) {
        Map<String, String> mensagem = Map.of(
                "leadId", leadId,
                "empresaLocatariaId", empresaLocatariaId,
                "nomeContato", nomeContato,
                "emailContato", emailContato
        );

        log.info("[RABBIT] Enviando mensagem de geração de contrato para Lead '{}' na fila '{}'", nomeContato, RabbitMQConfig.CONTRATO_QUEUE);

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.CONTRATO_EXCHANGE,
                RabbitMQConfig.CONTRATO_ROUTING_KEY,
                mensagem
        );
    }
}
