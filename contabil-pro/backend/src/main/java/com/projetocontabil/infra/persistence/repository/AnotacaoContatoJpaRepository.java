package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.infra.persistence.entity.AnotacaoContatoJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AnotacaoContatoJpaRepository extends JpaRepository<AnotacaoContatoJpaEntity, UUID> {
    List<AnotacaoContatoJpaEntity> findAllByContatoIdOrderByCriadoEmDesc(UUID contatoId);
}
