package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.infra.persistence.entity.DocumentoJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface DocumentoJpaRepository extends JpaRepository<DocumentoJpaEntity, UUID> {
    List<DocumentoJpaEntity> findAllByEmpresaLocatariaId(String empresaLocatariaId);
}
