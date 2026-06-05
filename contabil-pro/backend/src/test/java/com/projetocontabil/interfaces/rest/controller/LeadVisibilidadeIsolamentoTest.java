package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.domain.atendimento.model.Atendimento;
import com.projetocontabil.core.domain.crm.model.StatusLead;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.domain.atendimento.model.StatusAtendimento;
import com.projetocontabil.core.domain.usuario.model.Usuario;
import com.projetocontabil.core.ports.driven.AtendimentoRepository;
import com.projetocontabil.core.ports.driven.LeadRepository;
import com.projetocontabil.core.ports.driven.UsuarioRepository;
import com.projetocontabil.core.domain.crm.vo.Identificacao;
import com.projetocontabil.core.domain.crm.vo.Email;
import com.projetocontabil.core.domain.crm.vo.Telefone;
import com.projetocontabil.core.ports.driven.DepartamentoRepository;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.RestTemplate;
 
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LeadVisibilidadeIsolamentoTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LeadRepository leadRepository;

    @MockitoBean
    private AtendimentoRepository atendimentoRepository;

    @MockitoBean
    private DepartamentoRepository departamentoRepository;
 
    @MockitoBean
    private SimpMessagingTemplate messagingTemplate;

    @MockitoBean
    private RabbitTemplate rabbitTemplate;

    @MockitoBean
    private JavaMailSender mailSender;
 
    @MockitoBean
    private RestTemplate restTemplate;

    @MockitoBean
    private UsuarioRepository usuarioRepository;
 
    private static final String TENANT = "test-tenant";
    // Usar UUIDs fixos como username do @WithMockUser (SecurityContext puro)
    private static final UUID OPERADOR_ID = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID OUTRO_OPERADOR_ID = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static final UUID GESTOR_ID = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static final UUID DEPARTAMENTO_ID = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static final UUID OUTRO_DEPARTAMENTO_ID = UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    /**
     * Cria um mock de Usuario do domínio para simular o banco.
     */
    /**
     * Cria um mock de Usuario do domínio para simular o banco.
     * O campo 'role' (legacy String) é o que o LeadController usa via getRole().
     * O enum Papel só tem ADMIN, GESTOR e CONVIDADO — operadores usam CONVIDADO.
     */
    private Usuario criarUsuarioMock(UUID id, String roleString, UUID deptoId) {
        com.projetocontabil.core.domain.usuario.model.Papel papelEnum;
        if ("ADMIN".equalsIgnoreCase(roleString)) {
            papelEnum = com.projetocontabil.core.domain.usuario.model.Papel.ADMIN;
        } else if ("GESTOR".equalsIgnoreCase(roleString)) {
            papelEnum = com.projetocontabil.core.domain.usuario.model.Papel.GESTOR;
        } else {
            papelEnum = com.projetocontabil.core.domain.usuario.model.Papel.CONVIDADO;
        }
        return Usuario.reconstituirCompleto(
            id, TENANT, id + "@test.com", id + "@test.com",
            "hash", "Teste", roleString, true,
            papelEnum, deptoId, null, null
        );
    }

    @Test
    @WithMockUser(username = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
    void operadorDeveVerApenasSeusLeadsOuFila() throws Exception {
        UUID leadMeuId = UUID.randomUUID();
        UUID leadFilaId = UUID.randomUUID();
        UUID leadOutroId = UUID.randomUUID();

        // Mock do UsuarioRepository: retorna operador do DEPARTAMENTO correto
        when(usuarioRepository.findById(OPERADOR_ID))
            .thenReturn(Optional.of(criarUsuarioMock(OPERADOR_ID, "OPERADOR", DEPARTAMENTO_ID)));

        // Isolar chamadas externas
        when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(Collections.emptyMap());
        when(departamentoRepository.findAllByEmpresaLocatariaId(EmpresaLocatariaId.of(TENANT))).thenReturn(Collections.emptyList());

        // Lead atribuído ao operador logado (mesmo departamento)
        Lead leadMeu = Lead.reconstituir(leadMeuId, EmpresaLocatariaId.of(TENANT), "Meu Lead", new Email("meu@test.com"), 
                new Telefone("11999999999"), new Identificacao("00000000000001"), "Empresa 1", 
                StatusLead.PROPOSTA, null, null, DEPARTAMENTO_ID, null, null, LocalDateTime.now(), 0, false, null);

        // Lead na fila (sem atendente no atendimento, mas do mesmo departamento)
        Lead leadFila = Lead.reconstituir(leadFilaId, EmpresaLocatariaId.of(TENANT), "Lead na Fila", new Email("fila@test.com"), 
                new Telefone("11888888888"), new Identificacao("00000000000002"), "Empresa 2", 
                StatusLead.AGUARDANDO, null, null, DEPARTAMENTO_ID, null, null, LocalDateTime.now(), 0, false, null);

        // Lead de outro departamento
        Lead leadOutro = Lead.reconstituir(leadOutroId, EmpresaLocatariaId.of(TENANT), "Outro Lead", new Email("outro@test.com"), 
                new Telefone("11777777777"), new Identificacao("00000000000003"), "Empresa 3", 
                StatusLead.PROPOSTA, null, null, OUTRO_DEPARTAMENTO_ID, null, null, LocalDateTime.now(), 0, false, null);

        when(leadRepository.findAllByEmpresaLocatariaId(EmpresaLocatariaId.of(TENANT))).thenReturn(List.of(leadMeu, leadFila, leadOutro));

        // Mock Atendimentos ativos da empresa
        Atendimento atMeu = Atendimento.reconstituir(UUID.randomUUID(), TENANT, leadMeuId, DEPARTAMENTO_ID, OPERADOR_ID, StatusAtendimento.EM_ATENDIMENTO, LocalDateTime.now(), LocalDateTime.now(), null, LocalDateTime.now(), false, false);
        Atendimento atFila = Atendimento.reconstituir(UUID.randomUUID(), TENANT, leadFilaId, DEPARTAMENTO_ID, null, StatusAtendimento.AGUARDANDO, LocalDateTime.now(), null, null, LocalDateTime.now(), false, false);
        Atendimento atOutro = Atendimento.reconstituir(UUID.randomUUID(), TENANT, leadOutroId, OUTRO_DEPARTAMENTO_ID, OUTRO_OPERADOR_ID, StatusAtendimento.EM_ATENDIMENTO, LocalDateTime.now(), LocalDateTime.now(), null, LocalDateTime.now(), false, false);

        when(atendimentoRepository.findAllAtivosByEmpresa(TENANT)).thenReturn(List.of(atMeu, atFila, atOutro));

        mockMvc.perform(get("/api/leads/contatos")
                .header("X-EmpresaLocataria-Id", TENANT))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2)) 
                .andExpect(jsonPath("$[?(@.nome == 'Meu Lead')]").exists())
                .andExpect(jsonPath("$[?(@.nome == 'Lead na Fila')]").exists())
                .andExpect(jsonPath("$[?(@.nome == 'Outro Lead')]").doesNotExist());
    }

    @Test
    @WithMockUser(username = "cccccccc-cccc-cccc-cccc-cccccccccccc")
    void gestorDeveVerTodosOsLeads() throws Exception {
        UUID leadQualquerId = UUID.randomUUID();

        // Mock do UsuarioRepository: retorna GESTOR
        when(usuarioRepository.findById(GESTOR_ID))
            .thenReturn(Optional.of(criarUsuarioMock(GESTOR_ID, "GESTOR", null)));
        
        // Isolar chamadas externas
        when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(Collections.emptyMap());
        when(departamentoRepository.findAllByEmpresaLocatariaId(EmpresaLocatariaId.of(TENANT))).thenReturn(Collections.emptyList());

        Lead leadQualquer = Lead.reconstituir(leadQualquerId, EmpresaLocatariaId.of(TENANT), "Qualquer Lead", new Email("gestor@test.com"), 
                new Telefone("11666666666"), new Identificacao("00000000000004"), "Empresa 4", 
                StatusLead.PROPOSTA, null, null, null, null, null, LocalDateTime.now(), 0, false, null);

        when(leadRepository.findAllByEmpresaLocatariaId(EmpresaLocatariaId.of(TENANT))).thenReturn(List.of(leadQualquer));
        when(atendimentoRepository.findAllAtivosByEmpresa(TENANT)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/leads/contatos")
                .header("X-EmpresaLocataria-Id", TENANT))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].nome").value("Qualquer Lead"));
    }

    @Test
    @WithMockUser(username = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
    void operadorNaoDeveVerLeadsDeOutroDepartamento() throws Exception {
        UUID leadDeptoBId = UUID.randomUUID();

        // Mock do UsuarioRepository: retorna operador do DEPARTAMENTO_ID
        when(usuarioRepository.findById(OPERADOR_ID))
            .thenReturn(Optional.of(criarUsuarioMock(OPERADOR_ID, "OPERADOR", DEPARTAMENTO_ID)));
        
        // Isolar chamadas externas
        when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(Collections.emptyMap());
        when(departamentoRepository.findAllByEmpresaLocatariaId(EmpresaLocatariaId.of(TENANT))).thenReturn(Collections.emptyList());

        Lead leadDeptoB = Lead.reconstituir(leadDeptoBId, EmpresaLocatariaId.of(TENANT), "Lead do B", new Email("b@test.com"), 
                new Telefone("11555555555"), new Identificacao("00000000000005"), "Empresa 5", 
                StatusLead.PROPOSTA, null, null, OUTRO_DEPARTAMENTO_ID, null, null, LocalDateTime.now(), 0, false, null);

        when(leadRepository.findAllByEmpresaLocatariaId(EmpresaLocatariaId.of(TENANT))).thenReturn(List.of(leadDeptoB));
        when(atendimentoRepository.findAllAtivosByEmpresa(TENANT)).thenReturn(Collections.emptyList());

        // Operador do DEPARTAMENTO_ID tentando ver lead do OUTRO_DEPARTAMENTO_ID
        mockMvc.perform(get("/api/leads/contatos")
                .header("X-EmpresaLocataria-Id", TENANT))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}
