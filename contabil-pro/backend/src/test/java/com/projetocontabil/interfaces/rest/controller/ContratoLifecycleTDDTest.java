package com.projetocontabil.interfaces.rest.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projetocontabil.core.domain.crm.model.Contrato;
import com.projetocontabil.core.domain.crm.model.StatusContrato;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.ContratoRepository;
import com.projetocontabil.core.ports.driven.LeadRepository;
import com.projetocontabil.infra.messaging.ContratoProducer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ContratoLifecycleTDDTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ContratoRepository contratoRepository;

    @MockitoBean
    private LeadRepository leadRepository;

    @MockitoBean
    private ContratoProducer contratoProducer;

    @MockitoBean
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @MockitoBean
    private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    @MockitoBean
    private org.springframework.mail.javamail.JavaMailSender mailSender;

    @MockitoBean
    private org.springframework.web.client.RestTemplate restTemplate;

    private static final String TENANT = "tenant-contratos-test";

    @Test
    void deveCancelarContratoExigindoMotivoObrigatorio() throws Exception {
        UUID contratoId = UUID.randomUUID();
        UUID leadId = UUID.randomUUID();
        Contrato contrato = Contrato.reconstituir(
                contratoId, leadId, EmpresaLocatariaId.of(TENANT),
                StatusContrato.AGUARDANDO_ASSINATURA, null, "http://zap", "Empresa Teste", "teste@empresa.com",
                LocalDateTime.now(), LocalDateTime.now()
        );

        when(contratoRepository.findById(contratoId)).thenReturn(Optional.of(contrato));

        // Sem motivo -> Deve retornar 400 Bad Request
        mockMvc.perform(patch("/api/contratos/" + contratoId + "/cancelar")
                .header("X-EmpresaLocataria-Id", TENANT)
                .param("motivo", ""))
                .andExpect(status().isBadRequest());

        // Com motivo válido -> Deve retornar 200 OK
        mockMvc.perform(patch("/api/contratos/" + contratoId + "/cancelar")
                .header("X-EmpresaLocataria-Id", TENANT)
                .param("motivo", "Cliente optou por concorrente"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELADO")))
                .andExpect(jsonPath("$.motivoCancelamento", is("Cliente optou por concorrente")));
    }

    @Test
    void deveCriarNovoContratoEEnviarParaZapSign() throws Exception {
        UUID leadId = UUID.randomUUID();
        Map<String, Object> body = Map.of(
                "leadId", leadId.toString(),
                "nomeContato", "Carlos Contador",
                "emailContato", "carlos@escritorio.com"
        );

        mockMvc.perform(post("/api/contratos/novo")
                .header("X-EmpresaLocataria-Id", TENANT)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("GERANDO")));
    }
}
