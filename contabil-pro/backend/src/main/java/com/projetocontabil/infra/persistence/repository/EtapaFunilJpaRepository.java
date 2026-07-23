package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.infra.persistence.entity.EtapaFunilJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EtapaFunilJpaRepository extends JpaRepository<EtapaFunilJpaEntity, UUID> {
    List<EtapaFunilJpaEntity> findAllByEmpresaLocatariaIdOrderByOrdemAsc(String empresaLocatariaId);
    void deleteByEmpresaLocatariaIdAndChave(String empresaLocatariaId, String chave);
}
