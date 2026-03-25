package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.infra.persistence.entity.ExternalConnectionJpaEntity;
import com.projetocontabil.core.domain.crm.model.enums.ConnectionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import com.projetocontabil.core.domain.crm.model.enums.ConnectionProvider;

@Repository
public interface ExternalConnectionRepository extends JpaRepository<ExternalConnectionJpaEntity, UUID> {
    List<ExternalConnectionJpaEntity> findAllByStatus(ConnectionStatus status);
    Optional<ExternalConnectionJpaEntity> findByEmpresaLocatariaIdAndProvider(String empresaLocatariaId, ConnectionProvider provider);
}
