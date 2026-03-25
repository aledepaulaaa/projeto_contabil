package com.projetocontabil.infra.integrations.googleads;

import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.ports.driven.LeadRepository;
import com.projetocontabil.infra.persistence.repository.ExternalConnectionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GoogleAdsSyncServiceTest {

    @Mock
    private ExternalConnectionRepository connectionRepository;

    @Mock
    private LeadRepository leadRepository;

    @InjectMocks
    private GoogleAdsSyncService syncService;

    @Test
    @DisplayName("Deve ignorar lead se já existir no banco por google_lead_id")
    void deveIgnorarLeadDuplicado() {
        String googleLeadId = "g-123";
        when(leadRepository.findByGoogleLeadId(googleLeadId))
                .thenReturn(Optional.of(mock(Lead.class)));

        syncService.saveExternalLead("tenant-1", "João", "joao@email.com", googleLeadId);

        verify(leadRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve salvar lead novo se não existir no banco")
    void deveSalvarLeadNovo() {
        String googleLeadId = "g-456";
        when(leadRepository.findByGoogleLeadId(googleLeadId))
                .thenReturn(Optional.empty());

        syncService.saveExternalLead("tenant-1", "Maria", "maria@email.com", googleLeadId);

        verify(leadRepository, times(1)).save(any());
    }
}
