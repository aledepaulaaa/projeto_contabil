package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.infra.persistence.entity.ContratoJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContratoJpaRepository extends JpaRepository<ContratoJpaEntity, UUID> {
    Optional<ContratoJpaEntity> findByLeadId(UUID leadId);
    List<ContratoJpaEntity> findAllByEmpresaLocatariaId(String empresaLocatariaId);
}
