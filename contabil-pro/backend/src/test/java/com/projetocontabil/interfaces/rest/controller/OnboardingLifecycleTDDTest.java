package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.domain.crm.model.StatusLead;
import com.projetocontabil.core.domain.onboarding.model.Onboarding;
import com.projetocontabil.core.domain.onboarding.model.StatusOnboarding;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.LeadRepository;
import com.projetocontabil.core.ports.driven.OnboardingRepository;
import com.projetocontabil.infra.tenancy.EmpresaLocatariaContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@org.springframework.test.context.TestPropertySource(properties = {
    "MAIL_HOST=localhost",
    "MAIL_PORT=25",
    "MAIL_USERNAME=dummy",
    "MAIL_PASSWORD=dummy",
    "GOOGLE_CLIENT_ID=dummy",
    "GOOGLE_CLIENT_SECRET=dummy",
    "GOOGLE_ADS_DEVELOPER_TOKEN=dummy",
    "GOOGLE_ADS_CLIENT_CUSTOMER_ID=dummy",
    "MAILTRAP_API_TOKEN=dummy"
})
public class OnboardingLifecycleTDDTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private LeadRepository leadRepository;

    @MockBean
    private OnboardingRepository onboardingRepository;

    private final String empresaId = UUID.randomUUID().toString();
    private final UUID leadId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        EmpresaLocatariaContext.setEmpresaLocatariaId(empresaId);
    }

    @Test
    @DisplayName("Deve iniciar Onboarding automaticamente ao mover Lead para FECHAMENTO")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void deveIniciarOnboardingAoFecharLead() throws Exception {
        // GIVEN
        Lead lead = mock(Lead.class);
        when(lead.getId()).thenReturn(leadId);
        when(lead.getEmpresaLocatariaId()).thenReturn(EmpresaLocatariaId.of(empresaId));
        when(lead.getNomeContato()).thenReturn("Cliente Teste");
        when(lead.getStatus()).thenReturn(StatusLead.PROPOSTA);
        
        when(leadRepository.findById(leadId)).thenReturn(Optional.of(lead));

        // WHEN
        mockMvc.perform(patch("/api/leads/" + leadId + "/status")
                .param("status", "FECHAMENTO")
                .header("X-Usuario-Id", UUID.randomUUID().toString())
                .header("X-EmpresaLocataria-Id", empresaId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        // THEN
        // Deve ter salvo o lead com novo status
        verify(leadRepository, atLeastOnce()).save(any(Lead.class));
        
        // Deve ter chamado a criação do Onboarding
        verify(onboardingRepository, times(1)).save(any(Onboarding.class));
    }

    @Test
    @DisplayName("Deve garantir isolamento multi-tenant na criação do Onboarding")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void deveGarantirIsolamentoMultiTenant() throws Exception {
        // Mock de lead para outra empresa
        String outraEmpresaId = UUID.randomUUID().toString();
        
        Lead leadOutraEmpresa = mock(Lead.class);
        when(leadOutraEmpresa.getEmpresaLocatariaId()).thenReturn(EmpresaLocatariaId.of(outraEmpresaId));
        when(leadRepository.findById(leadId)).thenReturn(Optional.of(leadOutraEmpresa));

        // Tentar mover status com contexto de empresaId (diferente da empresa do lead)
        mockMvc.perform(patch("/api/leads/" + leadId + "/status")
                .param("status", "FECHAMENTO")
                .header("X-Usuario-Id", UUID.randomUUID().toString())
                .header("X-EmpresaLocataria-Id", empresaId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound()); 

        verify(onboardingRepository, never()).save(any());
    }
}
