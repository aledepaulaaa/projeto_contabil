package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.ports.driven.LeadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/whatsapp/leads")
@RequiredArgsConstructor
@Slf4j
public class WhatsAppLeadController {

    private final LeadRepository leadRepository;

    /**
     * Marca todas as mensagens de um Lead como lidas.
     */
    @PatchMapping("/{leadId}/read")
    public ResponseEntity<Void> marcarComoLido(@PathVariable UUID leadId) {
        log.info("Marcando mensagens como lidas para o Lead: {}", leadId);
        
        return leadRepository.findById(leadId).map(lead -> {
            lead.resetarMensagensNaoLidas();
            leadRepository.save(lead);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
