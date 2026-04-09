package com.projetocontabil.infra.messaging;

import com.projetocontabil.core.usecases.crm.GerarContratoUseCase;
import com.projetocontabil.infra.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

/**
 * Consumer que escuta a fila de geração de contratos e delega ao GerarContratoUseCase.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ContratoConsumer {

    private final GerarContratoUseCase gerarContratoUseCase;

    @RabbitListener(queues = RabbitMQConfig.CONTRATO_QUEUE)
    public void processarGeracaoDeContrato(Map<String, String> mensagem) {
        String leadId = mensagem.get("leadId");
        String empresaLocatariaId = mensagem.get("empresaLocatariaId");
        String nomeContato = mensagem.get("nomeContato");
        String emailContato = mensagem.get("emailContato");

        log.info("[RABBIT] Processando geração de contrato para Lead '{}' (empresa: {})", nomeContato, empresaLocatariaId);

        try {
            gerarContratoUseCase.executar(
                    UUID.fromString(leadId),
                    empresaLocatariaId,
                    nomeContato,
                    emailContato
            );
        } catch (Exception e) {
            log.error("[RABBIT] Erro ao processar geração de contrato para Lead '{}': {}", nomeContato, e.getMessage(), e);
        }
    }
}
