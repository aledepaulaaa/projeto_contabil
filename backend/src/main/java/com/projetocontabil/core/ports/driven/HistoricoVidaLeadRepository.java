package com.projetocontabil.core.ports.driven;

import com.projetocontabil.core.domain.crm.model.HistoricoVidaLead;

import java.util.Optional;
import java.util.UUID;

public interface HistoricoVidaLeadRepository {
    HistoricoVidaLead save(HistoricoVidaLead historico);
    Optional<HistoricoVidaLead> findByLeadId(UUID leadId);
}
