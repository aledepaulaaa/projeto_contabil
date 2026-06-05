package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.infra.persistence.entity.AutomacaoTemplateJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AutomacaoTemplateJpaRepository extends JpaRepository<AutomacaoTemplateJpaEntity, UUID> {
    List<AutomacaoTemplateJpaEntity> findAllByEmpresaLocatariaId(String empresaLocatariaId);
    Optional<AutomacaoTemplateJpaEntity> findByEmpresaLocatariaIdAndGatilho(String empresaLocatariaId, String gatilho);
}
