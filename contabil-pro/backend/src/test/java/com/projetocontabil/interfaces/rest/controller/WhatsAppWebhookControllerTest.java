package com.projetocontabil.interfaces.rest.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.test.context.bean.override.mockito.MockitoBean;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class WhatsAppWebhookControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @MockitoBean
    private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    @MockitoBean
    private org.springframework.mail.javamail.JavaMailSender mailSender;

    @MockitoBean
    private org.springframework.web.client.RestTemplate restTemplate;

    @Test
    @WithMockUser(username = "admin")
    void deveReceberMensagemDoWebhook() throws Exception {
        String jsonPayload = """
                {
                    "from": "5511999999999",
                    "message": "Olá, esta é uma mensagem de teste",
                    "timestamp": 1625097600
                }
                """;

        mockMvc.perform(post("/api/whatsapp/webhook")
                .contentType(MediaType.APPLICATION_JSON_VALUE)
                .content(jsonPayload)
                .header("X-Tenant-ID", "test-tenant"))
                .andExpect(status().isOk());
    }
}
