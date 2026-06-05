package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.infra.persistence.entity.EmpresaLocatariaJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EmpresaLocatariaJpaRepository extends JpaRepository<EmpresaLocatariaJpaEntity, String> {
    Optional<EmpresaLocatariaJpaEntity> findByEmpresaId(String empresaId);
}
