package com.projetocontabil.infra.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "api.google-ads")
public class GoogleAdsProperties {
    private String developerToken;
    private String clientCustomerId;
    private String clientId;
    private String clientSecret;
    private String redirectUri;

    public String getDeveloperToken() { return developerToken; }
    public void setDeveloperToken(String developerToken) { this.developerToken = developerToken; }

    public String getClientCustomerId() { return clientCustomerId; }
    public void setClientCustomerId(String clientCustomerId) { this.clientCustomerId = clientCustomerId; }

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getClientSecret() { return clientSecret; }
    public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }

    public String getRedirectUri() { return redirectUri; }
    public void setRedirectUri(String redirectUri) { this.redirectUri = redirectUri; }
}
