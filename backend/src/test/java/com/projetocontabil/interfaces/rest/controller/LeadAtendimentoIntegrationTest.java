package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.domain.crm.model.StatusLead;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.LeadRepository;
import com.projetocontabil.infra.tenancy.EmpresaLocatariaContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LeadAtendimentoIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LeadRepository leadRepository;

    @Test
    @WithMockUser(username = "admin")
    void deveListarLeadsFormatadosParaAtendimento() throws Exception {
        EmpresaLocatariaContext.setEmpresaLocatariaId("test-tenant");
        UUID leadId = UUID.randomUUID();
        Lead mockLead = mock(Lead.class);
        when(mockLead.getId()).thenReturn(leadId);
        when(mockLead.getNomeContato()).thenReturn("Roberto Silva");
        when(mockLead.getStatus()).thenReturn(StatusLead.PROPOSTA);
        when(mockLead.getEmpresaLocatariaId()).thenReturn(EmpresaLocatariaId.of("test-tenant"));

        when(leadRepository.findAllByEmpresaLocatariaId(any())).thenReturn(List.of(mockLead));

        mockMvc.perform(get("/api/leads/contatos")
                .header("X-Tenant-ID", "test-tenant")) // Custom header for tenancy
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nome").value("Roberto Silva"))
                .andExpect(jsonPath("$[$0].tabType").exists());
        
        EmpresaLocatariaContext.clear();
    }
}
