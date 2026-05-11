package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.infra.persistence.entity.EmpresaJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmpresaJpaRepository extends JpaRepository<EmpresaJpaEntity, UUID> {
    List<EmpresaJpaEntity> findByEmpresaLocatariaId(String empresaLocatariaId);
    Optional<EmpresaJpaEntity> findByIdAndEmpresaLocatariaId(UUID id, String empresaLocatariaId);
    Optional<EmpresaJpaEntity> findByIdentificacaoAndEmpresaLocatariaId(String identificacao, String empresaLocatariaId);
}
