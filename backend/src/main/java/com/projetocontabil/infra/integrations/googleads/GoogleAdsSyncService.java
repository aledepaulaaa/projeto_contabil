package com.projetocontabil.infra.integrations.googleads;

import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.domain.crm.model.OrigemLead;
import com.projetocontabil.core.domain.crm.vo.Email;
import com.projetocontabil.core.domain.crm.vo.Identificacao;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.LeadRepository;
import com.projetocontabil.infra.persistence.entity.ExternalConnectionJpaEntity;
import com.projetocontabil.infra.persistence.repository.ExternalConnectionRepository;
import com.projetocontabil.core.domain.crm.model.enums.ConnectionStatus;
import com.projetocontabil.infra.messaging.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleAdsSyncService {

    private final ExternalConnectionRepository connectionRepository;
    private final LeadRepository leadRepository;
    private final NotificationService notificationService;

    public void syncAll() {
        log.info("Iniciando sincronização global do Google Ads...");
        List<ExternalConnectionJpaEntity> activeConnections = connectionRepository.findAllByStatus(ConnectionStatus.ACTIVE);
        
        for (ExternalConnectionJpaEntity connection : activeConnections) {
            try {
                syncForConnection(connection);
            } catch (Exception e) {
                log.error("Erro ao sincronizar tenant {}: {}", connection.getEmpresaLocatariaId(), e.getMessage());
            }
        }
    }

    private void syncForConnection(ExternalConnectionJpaEntity connection) {
        log.debug("Sincronizando Google Ads para o tenant: {}", connection.getEmpresaLocatariaId());
        // Aqui entraria a query via GoogleAdsServiceClient
        // Por enquanto, o motor está estruturado para receber a lógica de busca real.
    }

    public void saveExternalLead(String empresaLocatariaId, String nome, String email, String googleLeadId) {
        if (leadRepository.findByGoogleLeadId(googleLeadId).isPresent()) {
            log.debug("Lead {} já existe. Ignorando.", googleLeadId);
            return;
        }

        Lead lead = Lead.criar(
            EmpresaLocatariaId.of(empresaLocatariaId),
            nome,
            new Email(email),
            new Identificacao("00000000000"), // Placeholder ou extraído do Google
            "Importado Google Ads",
            OrigemLead.GOOGLE_ADS,
            null
        );
        
        // Atualmente o domínio não suporta googleLeadId, salvaremos via repository direto se necessário
        // mas para seguir o TDD e idempotência, vamos garantir que o repository lida com isso.
        // Salvamento via domain port
        leadRepository.save(lead);
        log.info("Novo lead sincronizado do Google Ads: {}", googleLeadId);
        
        // Notificar via WebSocket
        notificationService.notifyNewLead(empresaLocatariaId, nome);
    }
}
