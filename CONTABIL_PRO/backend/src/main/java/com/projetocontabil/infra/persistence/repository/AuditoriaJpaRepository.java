package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.infra.persistence.entity.AuditoriaJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface AuditoriaJpaRepository extends JpaRepository<AuditoriaJpaEntity, UUID> {
    List<AuditoriaJpaEntity> findAllByEmpresaLocatariaIdOrderByCriadoEmDesc(String empresaLocatariaId);

    @Modifying
    @Transactional
    void deleteAllByEmpresaLocatariaId(String empresaLocatariaId);
}
