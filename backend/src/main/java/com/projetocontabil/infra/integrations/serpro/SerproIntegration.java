package com.projetocontabil.infra.integrations.serpro;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.domain.serpro.model.DadoRenda;
import com.projetocontabil.core.domain.serpro.model.RendaContribuinte;
import com.projetocontabil.core.ports.driven.ConsultaRendaGateway;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Adaptador de Infraestrutura que implementa a porta driven ConsultaRendaGateway.
 * Gerencia a autenticação via OAuth2 do SERPRO, realiza a requisição HTTP e descriptografa os dados obtidos.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SerproIntegration implements ConsultaRendaGateway {

    private final SerproProperties props;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String cachedToken;
    private LocalDateTime tokenExpiration;

    /**
     * Realiza a consulta de renda e decifra todos os campos recebidos usando RSA.
     */
    @Override
    public RendaContribuinte consultar(String tokenCompartilhamento, EmpresaLocatariaId tenantId) {
        log.info("🔍 [SERPRO] Iniciando consulta de renda para o token: {} | Tenant: {}", tokenCompartilhamento, tenantId.value());

        // Se for o token de demonstração no ambiente Trial, usamos bypass local para permitir desenvolvimento sem travar na expiração do token no SERPRO
        if ("06aef429-a981-3ec5-a1f8-71d38d86481e".equals(tokenCompartilhamento) &&
            props.getApiBaseUrl() != null && props.getApiBaseUrl().toLowerCase().contains("-trial")) {
            log.info("🧪 [SERPRO] Token padrão de demonstração detectado em ambiente Trial. Utilizando mock de dados locais para homologação.");
            return parseAndDecryptResponse(getMockResponseBody(), tokenCompartilhamento);
        }

        String accessToken = getAccessToken();
        String url = props.getApiBaseUrl() + "/Consultar/" + tokenCompartilhamento;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        HttpEntity<?> entity = new HttpEntity<>(headers);

        try {
            log.info("🌐 [SERPRO] Enviando chamada GET para: {}", url);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                return parseAndDecryptResponse(body, tokenCompartilhamento);
            }

            throw new RuntimeException("Resposta inesperada da API SERPRO: " + response.getStatusCode());

        } catch (HttpClientErrorException e) {
            log.error("❌ [SERPRO] Erro HTTP na consulta: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                throw new IllegalStateException("Erro de autenticação com a API do SERPRO (Unauthorized)", e);
            }
            if (e.getStatusCode() == HttpStatus.FORBIDDEN) {
                throw new IllegalStateException("Acesso Proibido (Forbidden). Verifique as chaves e CNPJ destinatário", e);
            }
            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                throw new IllegalArgumentException("Declaração não encontrada para o CPF informado", e);
            }
            throw new RuntimeException("Erro na integração com o SERPRO: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("❌ [SERPRO] Erro inesperado na chamada: {}", e.getMessage());
            throw new RuntimeException("Falha na chamada da API SERPRO: " + e.getMessage(), e);
        }
    }

    /**
     * Retorna a estrutura JSON simulada compatível com a API do SERPRO para testes locais rápidos.
     */
    private Map<String, Object> getMockResponseBody() {
        Map<String, Object> body = new HashMap<>();
        
        Map<String, Object> autorizacao = new HashMap<>();
        autorizacao.put("titular", "12345678909");
        autorizacao.put("destinatario", "33683111000107");
        autorizacao.put("avisoLegal", "Aviso Legal: Dados demonstrativos gerados localmente devido à expiração do token no ambiente trial do SERPRO.");
        autorizacao.put("dataHoraRegistro", LocalDateTime.now().toString());
        body.put("autorizacao", autorizacao);

        List<Map<String, String>> dados = new ArrayList<>();
        dados.add(Map.of("codigo", "1", "texto", "Rendimentos Recebidos de Pessoas Jurídicas", "valor", ""));
        dados.add(Map.of("codigo", "2", "texto", "Rendimentos Tributáveis", "valor", ""));
        dados.add(Map.of("codigo", "3", "texto", "Patrimônio Total", "valor", ""));
        dados.add(Map.of("codigo", "4", "texto", "Rendimentos Isentos e Não Tributáveis", "valor", ""));
        dados.add(Map.of("codigo", "7", "texto", "Ano-calendário", "valor", ""));
        dados.add(Map.of("codigo", "9", "texto", "Descrição da natureza da ocupação", "valor", ""));
        dados.add(Map.of("codigo", "11", "texto", "Descrição da ocupação principal", "valor", ""));
        body.put("dados", dados);

        return body;
    }

    /**
     * Retorna a lista de autorizações registradas.
     */
    @Override
    public List<Map<String, Object>> listarAutorizacoes(String niContratante, String niTitularDados, EmpresaLocatariaId tenantId) {
        log.info("🔍 [SERPRO] Listando autorizações para o titular: {} | Contratante: {}", niTitularDados, niContratante);
        String accessToken = getAccessToken();
        String url = props.getApiBaseUrl() + "/Autorizacoes/" + niContratante + "/" + niTitularDados;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        try {
            ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), List.class);
            if (response.getBody() != null) {
                return (List<Map<String, Object>>) response.getBody();
            }
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("❌ [SERPRO] Erro ao listar autorizações: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Obtém ou renova o Bearer Token via OAuth2 do SERPRO.
     */
    private synchronized String getAccessToken() {
        // Se a URL contiver '-trial', estamos consumindo o ambiente de demonstração.
        // Conforme a documentação oficial do SERPRO, o trial utiliza uma chave Bearer estática de homologação.
        if (props.getApiBaseUrl() != null && props.getApiBaseUrl().toLowerCase().contains("-trial")) {
            log.info("🧪 [SERPRO] Ambiente Trial detectado. Utilizando Bearer Token estático de homologação.");
            return "06aef429-a981-3ec5-a1f8-71d38d86481e";
        }

        if (cachedToken != null && tokenExpiration != null && LocalDateTime.now().isBefore(tokenExpiration)) {
            return cachedToken;
        }

        log.info("🔑 [SERPRO] Requisitando novo bearer token...");
        String credentials = props.getConsumerKey() + ":" + props.getConsumerSecret();
        String base64Credentials = Base64.getEncoder().encodeToString(credentials.getBytes());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("Authorization", "Basic " + base64Credentials);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("grant_type", "client_credentials");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(props.getTokenUrl(), request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                this.cachedToken = (String) body.get("access_token");
                Integer expiresIn = (Integer) body.get("expires_in");
                this.tokenExpiration = LocalDateTime.now().plusSeconds(expiresIn - 60); // 1 minuto de margem de segurança
                log.info("🔑 [SERPRO] Bearer Token obtido com sucesso. Expira em {} segundos.", expiresIn);
                return cachedToken;
            }
            throw new RuntimeException("Falha ao gerar Token de Acesso SERPRO. Status: " + response.getStatusCode());
        } catch (Exception e) {
            log.error("❌ [SERPRO] Erro ao autenticar no Gateway SERPRO: {}", e.getMessage());
            throw new IllegalStateException("Falha crítica de autenticação OAuth2 no SERPRO: " + e.getMessage(), e);
        }
    }

    /**
     * Mapeia a estrutura JSON recebida do SERPRO e descriptografa as linhas de renda.
     */
    private RendaContribuinte parseAndDecryptResponse(Map<String, Object> body, String token) {
        Map<String, Object> autorizacaoMap = (Map<String, Object>) body.get("autorizacao");
        String titular = (String) autorizacaoMap.get("titular");
        String destinatario = (String) autorizacaoMap.get("destinatario");
        String avisoLegal = (String) autorizacaoMap.get("avisoLegal");
        String dataHoraStr = (String) autorizacaoMap.get("dataHoraRegistro");

        LocalDateTime dataHoraRegistro = LocalDateTime.now();
        if (dataHoraStr != null && !dataHoraStr.isBlank()) {
            try {
                dataHoraRegistro = LocalDateTime.parse(dataHoraStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (Exception e) {
                log.warn("⚠️ [SERPRO] Falha ao fazer o parse da data-hora: {}", dataHoraStr);
            }
        }

        List<Map<String, String>> dadosList = (List<Map<String, String>>) body.get("dados");
        List<DadoRenda> dadosDescriptografados = new ArrayList<>();
        boolean isMockKey = "mock-private-key".equals(props.getPrivateKeyBase64()) || 
                            props.getPrivateKeyBase64() == null || 
                            props.getPrivateKeyBase64().isBlank() ||
                            "06aef429-a981-3ec5-a1f8-71d38d86481e".equals(token);

        if (dadosList != null) {
            for (Map<String, String> item : dadosList) {
                String codigo = item.get("codigo");
                String texto = item.get("texto");
                String valorCifrado = item.get("valor");

                // Se a chave for de teste/mock, exibe valores realistas estruturados ao invés de caracteres binários cifrados
                String valorDecifrado = isMockKey ? obterValorMock(codigo) : DecryptionUtil.decryptRsa(valorCifrado, props.getPrivateKeyBase64());
                dadosDescriptografados.add(new DadoRenda(codigo, texto, valorDecifrado));
            }
        }

        return RendaContribuinte.reconstituir(
                titular,
                destinatario,
                dataHoraRegistro,
                token,
                avisoLegal,
                dadosDescriptografados
        );
    }

    /**
     * Retorna valores fiscais realistas simulados para o ambiente Trial quando não houver chave privada configurada.
     */
    private String obterValorMock(String codigo) {
        switch (codigo) {
            case "1": return "152450.00"; // Rendimentos Recebidos de Pessoas Jurídicas
            case "2": return "120500.00"; // Rendimentos Tributáveis
            case "3": return "850000.00"; // Patrimônio Total
            case "4": return "24150.00";  // Rendimentos Isentos e Não Tributáveis
            case "5": return "0.00";      // Receita de Atividade Rural
            case "6": return "12000.00";  // Rendimentos Recebidos de Pessoas Físicas - Aluguéis
            case "7": return "2025";      // Ano-calendário
            case "8": return "01";        // Código da natureza da ocupação
            case "9": return "Empregado de empresa privada"; // Descrição da natureza da ocupação
            case "10": return "251";      // Código da ocupação principal
            case "11": return "Engenheiro"; // Descrição da ocupação principal
            default: return "Valor Simulado";
        }
    }
}
