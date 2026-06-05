package com.projetocontabil.infra.integrations.serpro;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Propriedades de configuração injetadas com base no prefixo 'serpro' no YML da aplicação.
 * Suporta URLs separadas para trial e produção, permitindo alternância via variável de ambiente.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "serpro")
public class SerproProperties {
    private String apiBaseUrl;
    private String baseUrlProd;
    private String tokenUrl;
    private String consumerKey;
    private String consumerSecret;
    private String privateKeyBase64;
}
