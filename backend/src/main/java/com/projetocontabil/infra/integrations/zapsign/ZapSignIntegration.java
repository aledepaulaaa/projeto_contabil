package com.projetocontabil.infra.integrations.zapsign;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.SignatureGateway;
import com.projetocontabil.core.ports.driven.SignatureGateway.Signer;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@Primary
@RequiredArgsConstructor
public class ZapSignIntegration implements SignatureGateway {

    private final ZapSignProperties props;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String accessToken;
    private String refreshToken;
    private LocalDateTime expiresAt;

    @PostConstruct
    public void init() {
        // Log de debug para garantir que as propriedades estao corretas
        log.info("⚙️ [ZapSign] Inicializando com API Base: {}", props.getApiBaseUrl());

        // Failsafe: Se a URL contiver sandbox, assume modo sandbox mesmo se a flag estiver off
        if (props.getApiBaseUrl() != null && props.getApiBaseUrl().toLowerCase().contains("sandbox")) {
            props.setSandboxMode(true);
            log.info("🛠️ [ZapSign] Modo Sandbox detectado via URL.");
        }

        if (props.isSandboxMode()) {
            log.info("🛠️ [ZapSign] Modo Sandbox Ativo. Autenticação JWT desabilitada totalmente.");
            return;
        }
        
        try {
            authenticate();
            log.info("🚀 [ZapSign] Autenticação realizada com sucesso para a organização {}", props.getIdOrganization());
        } catch (Exception e) {
            log.error("❌ [ZapSign] Falha na autenticação inicial: {}", e.getMessage());
        }
    }

    private synchronized void authenticate() {
        if (props.isSandboxMode()) return; // Nunca autentica via JWT em sandbox

        String url = props.getApiBaseUrl() + "/token/" + props.getIdOrganization();
        
        Map<String, String> body = new HashMap<>();
        body.put("username", props.getUsername());
        body.put("password", props.getPassword());

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url, HttpMethod.POST, new HttpEntity<>(body), 
                new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {}
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                this.accessToken = (String) response.getBody().get("access");
                this.refreshToken = (String) response.getBody().get("refresh");
                this.expiresAt = LocalDateTime.now().plusMinutes(55);
            }
        } catch (Exception e) {
            log.error("[ZapSign] Erro ao autenticar no endpoint de Produção: {}", e.getMessage());
        }
    }

    private synchronized void ensureAuthenticated() {
        if (props.isSandboxMode()) return;

        if (accessToken == null || expiresAt == null || LocalDateTime.now().isAfter(expiresAt)) {
            if (refreshToken != null) {
                try {
                    refresh();
                } catch (Exception e) {
                    log.warn("[ZapSign] Falha no refresh, tentando login completo...");
                    authenticate();
                }
            } else {
                authenticate();
            }
        }
    }

    private void refresh() {
        String url = props.getRefreshUrl();
        Map<String, String> body = new HashMap<>();
        body.put("refresh", refreshToken);

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
            url, HttpMethod.POST, new HttpEntity<>(body),
            new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {}
        );
        
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            this.accessToken = (String) response.getBody().get("access");
            this.expiresAt = LocalDateTime.now().plusMinutes(55);
            log.info("[ZapSign] Token de acesso renovado com sucesso.");
        } else {
            throw new RuntimeException("Falha ao renovar token ZapSign");
        }
    }

    @Override
    public String createDocumentOneClick(UUID contratoId, EmpresaLocatariaId tid, String title, String base64Content, List<Signer> signers) {
        ensureAuthenticated();

        String url = props.getApiBaseUrl();
        // Garantir que a URL base termina com /docs/ (seguranca contra URLs mal configuradas)
        if (!url.endsWith("/docs/")) {
            url = url + (url.endsWith("/") ? "docs/" : "/docs/");
        }
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        
        if (props.isSandboxMode()) {
            headers.set("Authorization", "Bearer " + props.getApiToken());
            // Algumas APIs sandbox exigem o token na URL mesmo com Bearer (failsafe funcional)
            if (!url.contains("api_token")) {
                url += (url.contains("?") ? "&" : "?") + "api_token=" + props.getApiToken();
            }
        } else {
            headers.setBearerAuth(accessToken);
            if (!url.contains("api_token")) {
                url += (url.contains("?") ? "&" : "?") + "api_token=" + props.getApiToken();
            }
        }

        Map<String, Object> body = new HashMap<>();
        body.put("name", title);
        body.put("base64_pdf", base64Content);
        body.put("one_click_active", true); 
        body.put("require_signature", true); // Exige checkbox + desenho da assinatura
        
        List<Map<String, Object>> signersList = signers.stream().map(s -> {
            Map<String, Object> signer = new HashMap<>();
            signer.put("name", s.name());
            signer.put("email", s.email());
            signer.put("send_automatic_email", true);
            return signer;
        }).toList();
        
        body.put("signers", signersList);

        try {
            // Serialização manual para garantir que o corpo seja enviado como JSON puro
            String jsonBody = objectMapper.writeValueAsString(body);
            HttpEntity<String> request = new HttpEntity<>(jsonBody, headers);
            
            log.debug("[ZapSign] Chamada POST para: {}", url);
            
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url, HttpMethod.POST, request,
                new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                // A ZapSign retorna uma lista de signatários com suas URLs
                List<Map<String, Object>> signersResponse = (List<Map<String, Object>>) response.getBody().get("signers");
                if (signersResponse != null && !signersResponse.isEmpty()) {
                    // Retorna a URL do primeiro signatário (que é o Lead/Cliente)
                    return (String) signersResponse.get(0).get("sign_url");
                }
            }
            throw new RuntimeException("Erro ao criar documento na ZapSign. Status: " + response.getStatusCode());
        } catch (Exception e) {
            log.error("[ZapSign] Erro crítico na chamada createDocumentOneClick: {}", e.getMessage());
            throw new RuntimeException("Falha na integração ZapSign: " + e.getMessage(), e);
        }
    }

    @Override
    @Deprecated
    public String createDocumentForSignature(UUID contratoId, EmpresaLocatariaId tid, String title, String urlOrTemplate, List<Signer> signers) {
        // Legado: Chamada simplificada para o Mock ou OneClick se possível
        return createDocumentOneClick(contratoId, tid, title, "DUMMY_CONTENT", signers);
    }
}
