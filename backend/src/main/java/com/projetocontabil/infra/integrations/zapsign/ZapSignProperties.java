package com.projetocontabil.infra.integrations.zapsign;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "zapsign")
public class ZapSignProperties {
    private boolean sandboxMode;
    private String username;
    private String password;
    private String apiToken;
    private String apiBaseUrl;
    private String idOrganization;
    private String refreshUrl;
}
