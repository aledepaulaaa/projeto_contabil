package com.projetocontabil.infra.integrations.googleads;

import com.projetocontabil.infra.config.GoogleAdsProperties;
import com.projetocontabil.infra.persistence.repository.ExternalConnectionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GoogleAdsOAuthServiceTest {

    @Mock
    private GoogleAdsProperties properties;

    @Mock
    private ExternalConnectionRepository repository;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private GoogleAdsOAuthService oAuthService;

    @Test
    @DisplayName("Deve gerar URL de autorização contendo o state com tenant_id")
    void deveGerarUrlAutorizacao() {
        String tenantId = "tenant-test-123";
        when(properties.getClientId()).thenReturn("client-id");
        when(properties.getRedirectUri()).thenReturn("http://localhost/callback");
        
        String url = oAuthService.generateAuthorizationUrl(tenantId);

        assertThat(url).contains("accounts.google.com/o/oauth2/v2/auth");
        assertThat(url).contains("state=" + tenantId);
        assertThat(url).contains("access_type=offline");
    }

    @Test
    @DisplayName("Deve trocar código por tokens e salvar conexão")
    @SuppressWarnings("unchecked")
    void deveTrocarCodigoPorTokens() {
        String code = "mock-auth-code";
        String state = "tenant-test-123";

        Map<String, Object> tokens = Map.of(
            "access_token", "at-123",
            "refresh_token", "rt-123",
            "expires_in", 3600
        );

        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                (Class<Map<String, Object>>) (Class) any(Class.class)
        )).thenReturn(new ResponseEntity<>(tokens, HttpStatus.OK));

        oAuthService.exchangeCodeForTokens(code, state);

        verify(repository).save(any());
    }
}
