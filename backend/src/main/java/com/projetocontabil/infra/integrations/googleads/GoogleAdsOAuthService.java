package com.projetocontabil.infra.integrations.googleads;

import com.projetocontabil.core.domain.crm.model.enums.ConnectionProvider;
import com.projetocontabil.core.domain.crm.model.enums.ConnectionStatus;
import com.projetocontabil.infra.config.GoogleAdsProperties;
import com.projetocontabil.infra.persistence.entity.ExternalConnectionJpaEntity;
import com.projetocontabil.infra.persistence.repository.ExternalConnectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleAdsOAuthService {

    private final GoogleAdsProperties properties;
    private final ExternalConnectionRepository repository;
    private final RestTemplate restTemplate;

    public String generateAuthorizationUrl(String empresaLocatariaId) {
        return UriComponentsBuilder.fromUriString("https://accounts.google.com/o/oauth2/v2/auth")
                .queryParam("client_id", properties.getClientId())
                .queryParam("redirect_uri", properties.getRedirectUri())
                .queryParam("response_type", "code")
                .queryParam("scope", "https://www.googleapis.com/auth/adwords")
                .queryParam("access_type", "offline")
                .queryParam("prompt", "consent")
                .queryParam("state", empresaLocatariaId)
                .build().toUriString();
    }

    public void exchangeCodeForTokens(String code, String state) {
        String url = "https://oauth2.googleapis.com/token";

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("code", code);
        body.add("client_id", properties.getClientId());
        body.add("client_secret", properties.getClientSecret());
        body.add("redirect_uri", properties.getRedirectUri());
        body.add("grant_type", "authorization_code");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url, HttpMethod.POST, request, (Class<Map<String, Object>>) (Class) Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> tokens = response.getBody();
                
                String accessToken = (String) tokens.get("access_token");
                String refreshToken = (String) tokens.get("refresh_token");
                Object expiresInObj = tokens.get("expires_in");
                Integer expiresIn = (expiresInObj instanceof Integer) ? (Integer) expiresInObj : 3600;

                saveConnection(state, accessToken, refreshToken, expiresIn);
            }
        } catch (Exception e) {
            log.error("Erro ao trocar código Google OAuth2: {}", e.getMessage());
            throw new RuntimeException("Falha na integração com Google Ads: " + e.getMessage());
        }
    }

    private void saveConnection(String empresaLocatariaId, String accessToken, String refreshToken, Integer expiresIn) {
        ExternalConnectionJpaEntity entity = new ExternalConnectionJpaEntity();
        entity.setId(UUID.randomUUID());
        entity.setEmpresaLocatariaId(empresaLocatariaId);
        entity.setProvider(ConnectionProvider.GOOGLE_ADS);
        entity.setAccessToken(accessToken);
        entity.setRefreshToken(refreshToken);
        entity.setExpiresAt(LocalDateTime.now().plusSeconds(expiresIn));
        entity.setStatus(ConnectionStatus.ACTIVE);
        entity.setLastSync(LocalDateTime.now());

        repository.save(entity);
    }
    public com.projetocontabil.core.domain.crm.model.enums.ConnectionStatus getConnectionStatus(String empresaLocatariaId) {
        return repository.findByEmpresaLocatariaIdAndProvider(empresaLocatariaId, ConnectionProvider.GOOGLE_ADS)
                .map(ExternalConnectionJpaEntity::getStatus)
                .orElse(null);
    }
}
