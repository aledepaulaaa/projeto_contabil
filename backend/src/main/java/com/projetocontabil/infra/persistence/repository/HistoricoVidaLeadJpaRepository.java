package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.infra.persistence.entity.HistoricoVidaLeadJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface HistoricoVidaLeadJpaRepository extends JpaRepository<HistoricoVidaLeadJpaEntity, UUID> {
    Optional<HistoricoVidaLeadJpaEntity> findByLeadId(UUID leadId);
}
