package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.infra.persistence.entity.DepartamentoJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DepartamentoJpaRepository extends JpaRepository<DepartamentoJpaEntity, UUID> {
    List<DepartamentoJpaEntity> findAllByEmpresaLocatariaId(String empresaLocatariaId);
    boolean existsByNomeAndEmpresaLocatariaId(String nome, String empresaLocatariaId);
    java.util.Optional<DepartamentoJpaEntity> findByNomeAndEmpresaLocatariaId(String nome, String empresaLocatariaId);
}
