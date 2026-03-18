package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.infra.persistence.entity.ProcessoJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ProcessoJpaRepository extends JpaRepository<ProcessoJpaEntity, UUID> {
    List<ProcessoJpaEntity> findAllByAlvaraId(UUID alvaraId);
}
