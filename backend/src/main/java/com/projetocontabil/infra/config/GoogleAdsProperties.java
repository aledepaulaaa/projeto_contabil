package com.projetocontabil.infra.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "api.google-ads")
@Getter
@Setter
public class GoogleAdsProperties {
    private String developerToken;
    private String clientCustomerId;
    private String clientId;
    private String clientSecret;
    private String redirectUri;
}
