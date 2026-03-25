package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.core.domain.crm.model.StatusLead;
import com.projetocontabil.infra.persistence.entity.LeadJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeadJpaRepository extends JpaRepository<LeadJpaEntity, UUID> {
    List<LeadJpaEntity> findAllByEmpresaLocatariaId(String empresaLocatariaId);
    boolean existsByCnpjAndEmpresaLocatariaId(String cnpj, String empresaLocatariaId);
    long countByEmpresaLocatariaIdAndStatus(String empresaLocatariaId, StatusLead status);
    Optional<LeadJpaEntity> findByGoogleLeadId(String googleLeadId);
}
