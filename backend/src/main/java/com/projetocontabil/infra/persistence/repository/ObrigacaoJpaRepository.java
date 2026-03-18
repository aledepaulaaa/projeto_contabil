package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.core.domain.rotinas.model.Obrigacao;
import com.projetocontabil.infra.persistence.entity.ObrigacaoJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ObrigacaoJpaRepository extends JpaRepository<ObrigacaoJpaEntity, UUID> {
    List<ObrigacaoJpaEntity> findAllByEmpresaLocatariaId(String empresaLocatariaId);

    long countByEmpresaLocatariaIdAndStatus(String empresaLocatariaId, Obrigacao.StatusObrigacao status);

    List<ObrigacaoJpaEntity> findAllByEmpresaLocatariaIdAndMesCompetenciaAndAnoCompetencia(
            String empresaLocatariaId, int mes, int ano);
}
