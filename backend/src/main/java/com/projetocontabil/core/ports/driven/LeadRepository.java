package com.projetocontabil.core.ports.driven;

import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.domain.crm.model.StatusLead;
import com.projetocontabil.core.domain.crm.vo.Identificacao;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeadRepository {
    Lead save(Lead lead);
    Optional<Lead> findById(UUID id);
    List<Lead> findAllByEmpresaLocatariaId(EmpresaLocatariaId id);
    boolean existsByIdentificacaoAndEmpresaLocatariaId(Identificacao identificacao, EmpresaLocatariaId id);
    long countByEmpresaLocatariaIdAndStatus(EmpresaLocatariaId id, StatusLead status);
    Optional<Lead> findByGoogleLeadId(String googleLeadId);
}
