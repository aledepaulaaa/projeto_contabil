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

    public void notifyNewLead(String empresaLocatariaId, String leadName, String leadId) {
        String destination = "/topic/leads/" + empresaLocatariaId;
        log.info("Enviando notificação de novo lead para: {}", destination);
        
        messagingTemplate.convertAndSend(destination, Map.of(
            "tipo", "NOVO_LEAD",
            "mensagem", "Novo lead capturado: " + leadName,
            "leadId", leadId,
            "data", System.currentTimeMillis()
        ));
    }

    /**
     * Notifica via WebSocket que um contrato foi gerado e está disponível.
     */
    public void notifyContratoDisponivel(String empresaLocatariaId, String nomeContato, String contratoId) {
        String destination = "/topic/contratos/" + empresaLocatariaId;
        log.info("Enviando notificação de contrato disponível para: {}", destination);

        messagingTemplate.convertAndSend(destination, Map.of(
            "tipo", "CONTRATO_DISPONIVEL",
            "mensagem", "Contrato do Lead " + nomeContato + " está disponível para assinatura",
            "contratoId", contratoId,
            "data", System.currentTimeMillis()
        ));
    }

    public void notifyWhatsAppSent(String empresaLocatariaId, String leadName, String etapa) {
        String destination = "/topic/whatsapp/" + empresaLocatariaId;
        log.info("Enviando notificação de WhatsApp enviado para: {}", destination);
        
        messagingTemplate.convertAndSend(destination, Map.of(
            "tipo", "WHATSAPP_ENVIADO",
            "mensagem", String.format("WhatsApp de %s enviado para %s!", etapa, leadName),
            "etapa", etapa,
            "data", System.currentTimeMillis()
        ));
    }

    public void notifyNewMessage(String leadId, String message, String remetente, long timestamp) {
        String destination = "/topic/chat/" + leadId;
        log.info("Enviando nova mensagem de chat para: {} (Remetente: {})", destination, remetente);
        
        messagingTemplate.convertAndSend(destination, Map.of(
            "tipo", "NOVA_MENSAGEM",
            "leadId", leadId,
            "mensagem", message,
            "remetente", remetente,
            "timestamp", timestamp
        ));
    }

    public void notifyReloadContacts(String empresaLocatariaId) {
        String destination = "/topic/leads/" + empresaLocatariaId;
        log.info("Enviando sinal de RELOAD_CONTACTS para: {}", destination);
        
        messagingTemplate.convertAndSend(destination, Map.of(
            "tipo", "RELOAD_CONTACTS",
            "data", System.currentTimeMillis()
        ));
    }

    public void notifyTransferencia(String empresaLocatariaId, String leadName, String deptoNome, String leadId) {
        String destination = "/topic/leads/" + empresaLocatariaId;
        log.info("Enviando notificação de transferência de lead para: {}", destination);
        
        messagingTemplate.convertAndSend(destination, Map.of(
            "tipo", "TRANSFERENCIA_ATENDIMENTO",
            "mensagem", String.format("🔄 Lead %s agora está em atendimento (%s)", leadName, deptoNome),
            "leadName", leadName,
            "deptoNome", deptoNome,
            "leadId", leadId,
            "data", System.currentTimeMillis()
        ));
    }

    public void notifyTransferenciaSetorial(String empresaLocatariaId, String deptoId, String leadName, String deptoNome, String leadId) {
        // Tópico restrito ao departamento destino
        String destination = "/topic/leads/" + empresaLocatariaId + "/" + deptoId;
        log.info("Enviando notificação de transferência SETORIAL para: {}", destination);
        
        messagingTemplate.convertAndSend(destination, Map.of(
            "tipo", "TRANSFERENCIA_ATENDIMENTO",
            "mensagem", String.format("🔄 Novo atendimento de %s no setor %s", leadName, deptoNome),
            "leadName", leadName,
            "deptoNome", deptoNome,
            "leadId", leadId,
            "data", System.currentTimeMillis()
        ));
    }

    public void notifyTarefaPrazo(String empresaLocatariaId, String tituloTarefa, String clientName, String onboardingId) {
        String destination = "/topic/onboarding/" + empresaLocatariaId;
        log.info("Enviando notificação de prazo de tarefa para: {}", destination);

        messagingTemplate.convertAndSend(destination, Map.of(
            "tipo", "PRAZO_TAREFA",
            "mensagem", String.format("⏰ Prazo Próximo: %s (Cliente: %s)", tituloTarefa, clientName),
            "onboardingId", onboardingId,
            "data", System.currentTimeMillis()
        ));
    }
}
