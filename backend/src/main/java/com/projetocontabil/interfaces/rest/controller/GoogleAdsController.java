package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.infra.integrations.googleads.GoogleAdsOAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/integrations/google-ads")
@RequiredArgsConstructor
public class GoogleAdsController {

    private final GoogleAdsOAuthService authService;

    @GetMapping("/authorize")
    public ResponseEntity<Void> authorize(@RequestParam String tenant_id) {
        String url = authService.generateAuthorizationUrl(tenant_id);
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url)).build();
    }

    @GetMapping("/callback")
    public ResponseEntity<String> callback(@RequestParam String code, @RequestParam String state) {
        authService.exchangeCodeForTokens(code, state);
        return ResponseEntity.ok("Conexão com Google Ads realizada com sucesso! Você pode fechar esta janela.");
    }

    @GetMapping("/status")
    public ResponseEntity<ConnectionStatusResponse> getStatus(@RequestParam String tenant_id) {
        var status = authService.getConnectionStatus(tenant_id);
        return ResponseEntity.ok(new ConnectionStatusResponse(status != null, status));
    }

    public record ConnectionStatusResponse(boolean connected, com.projetocontabil.core.domain.crm.model.enums.ConnectionStatus status) {}
}
