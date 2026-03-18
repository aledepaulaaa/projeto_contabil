package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.infra.persistence.entity.AlvaraJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface AlvaraJpaRepository extends JpaRepository<AlvaraJpaEntity, UUID> {
    List<AlvaraJpaEntity> findAllByEmpresaLocatariaId(String empresaLocatariaId);
    long countByEmpresaLocatariaIdAndStatus(String empresaLocatariaId, String status);
}
