package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.usuario.model.Papel;
import com.projetocontabil.core.domain.usuario.model.Usuario;
import com.projetocontabil.core.ports.driven.EmpresaLocatariaRepository;
import com.projetocontabil.core.ports.driven.UsuarioRepository;
import com.projetocontabil.core.domain.empresalocataria.model.EmpresaLocataria;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.domain.rotinas.model.RegimeTributario;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import com.projetocontabil.infra.messaging.WhatsAppProducer;
import com.projetocontabil.infra.messaging.EmailProducer;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
public class AuthProfileTDDTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UsuarioRepository usuarioRepository;

    @MockitoBean
    private EmpresaLocatariaRepository empresaRepository;

    @MockitoBean
    private com.projetocontabil.core.ports.driven.DepartamentoRepository departamentoRepository;

    @MockitoBean
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void deveRetornarEmailENomeEmpresaNoLogin() throws Exception {
        // GIVEN
        String username = "admin@test.com";
        String empresaId = "tenant-1";
        
        Usuario mockUsuario = Usuario.reconstituir(
                UUID.randomUUID(),
                empresaId,
                "real-email@test.com",
                username,
                "password", // Em teste real seria hash, mas AuthController tem fallback
                "Nome do Usuario",
                "ADMIN",
                true
        );

        EmpresaLocataria mockEmpresa = EmpresaLocataria.criar(
                EmpresaLocatariaId.of(empresaId),
                "Minha Empresa Real LTDA",
                "12345678000199",
                RegimeTributario.SIMPLES_NACIONAL
        );

        when(usuarioRepository.findByIdentificador(username)).thenReturn(Optional.of(mockUsuario));
        when(empresaRepository.findByEmpresaLocatariaId(EmpresaLocatariaId.of(empresaId))).thenReturn(Optional.of(mockEmpresa));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        // WHEN & THEN
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                        "username", username,
                        "password", "password"
                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Nome do Usuario"))
                .andExpect(jsonPath("$.email").value("real-email@test.com")) // RED: Campo ainda não existe
                .andExpect(jsonPath("$.nomeEmpresa").value("Minha Empresa Real LTDA")); // RED: Campo ainda não existe
    }
}
