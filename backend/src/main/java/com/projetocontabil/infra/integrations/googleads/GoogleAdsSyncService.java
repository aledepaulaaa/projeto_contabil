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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GoogleAdsSyncService {

    private static final Logger log = LoggerFactory.getLogger(GoogleAdsSyncService.class);

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
                log.error("Erro ao sincronizar empresa {}: {}", connection.getEmpresaLocatariaId(), e.getMessage());
            }
        }
    }

    private void syncForConnection(ExternalConnectionJpaEntity connection) {
        log.debug("Sincronizando Google Ads para a empresa: {}", connection.getEmpresaLocatariaId());
        // Aqui entraria a query via GoogleAdsServiceClient
        // Por enquanto, o motor está estruturado para receber a lógica de busca real.
    }

    public void saveExternalLead(String empresaLocatariaId, String nome, String email, String telefoneStr, String googleLeadId) {
        if (leadRepository.findByGoogleLeadId(googleLeadId).isPresent()) {
            log.debug("Lead {} já existe. Ignorando.", googleLeadId);
            return;
        }

        com.projetocontabil.core.domain.crm.vo.Telefone telefone = 
            (telefoneStr != null && !telefoneStr.isBlank()) ? new com.projetocontabil.core.domain.crm.vo.Telefone(telefoneStr) : null;

        Lead lead = Lead.criar(
            EmpresaLocatariaId.of(empresaLocatariaId),
            nome,
            new Email(email),
            telefone,
            new Identificacao("00000000000"), // Placeholder ou extraído do Google
            "Importado Google Ads",
            OrigemLead.GOOGLE_ADS,
            null
        );
        
        var salvo = leadRepository.save(lead);
        log.info("Novo lead sincronizado do Google Ads: {}", googleLeadId);
        
        // Registrar Evento na Timeline
        try {
            var historico = com.projetocontabil.core.domain.crm.model.HistoricoVidaLead.criar(salvo.getId(), salvo.getEmpresaLocatariaId());
            historico.registrarEvento("SYNC_GOOGLE_ADS", "Lead sincronizado via Google Ads API", com.projetocontabil.core.domain.crm.model.EventoHistoricoLead.MarcadorEvento.NEUTRO);
            
            if (telefone == null) {
                historico.registrarEvento("DADOS_AUSENTES", "Lead Google Ads sem telefone disponível para automação WhatsApp.", com.projetocontabil.core.domain.crm.model.EventoHistoricoLead.MarcadorEvento.ATENCAO);
            }
            // Precisamos desse repository aqui? Vamos injetar se for necessário, mas por enquanto vamos assumir
            // que o service já tem acesso ou usaremos um HistoricoVidaLeadRepository
        } catch (Exception e) {
            log.error("Erro ao registrar histórico para lead Ads: {}", e.getMessage());
        }

        // Notificar via WebSocket
        notificationService.notifyNewLead(empresaLocatariaId, nome, salvo.getId().toString());
    }
}
