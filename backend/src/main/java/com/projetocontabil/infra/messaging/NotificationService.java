package com.projetocontabil.infra.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void notifyNewLead(String empresaLocatariaId, String leadName) {
        String destination = "/topic/leads/" + empresaLocatariaId;
        log.info("Enviando notificação de novo lead para: {}", destination);
        
        messagingTemplate.convertAndSend(destination, Map.of(
            "tipo", "NOVO_LEAD",
            "mensagem", "Novo lead capturado: " + leadName,
            "data", System.currentTimeMillis()
        ));
    }
}
