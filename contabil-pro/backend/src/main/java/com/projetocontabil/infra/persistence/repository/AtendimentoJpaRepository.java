package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.core.domain.atendimento.model.StatusAtendimento;
import com.projetocontabil.infra.persistence.entity.AtendimentoJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AtendimentoJpaRepository extends JpaRepository<AtendimentoJpaEntity, UUID> {
    
    @Query("SELECT a FROM AtendimentoJpaEntity a WHERE a.leadId = :leadId AND a.status <> 'ENCERRADO'")
    Optional<AtendimentoJpaEntity> findAtendimentoAtivoPorLead(UUID leadId);

    @Query("SELECT a FROM AtendimentoJpaEntity a WHERE a.empresaLocatariaId = :empresaId AND a.status <> 'ENCERRADO'")
    List<AtendimentoJpaEntity> findAllAtivosByEmpresa(String empresaId);

    List<AtendimentoJpaEntity> findAllByEmpresaLocatariaId(String empresaLocatariaId);

    List<AtendimentoJpaEntity> findAllByDepartamentoId(UUID departamentoId);


    long countByEmpresaLocatariaId(String empresaLocatariaId);
    
    long countByEmpresaLocatariaIdAndStatus(String empresaLocatariaId, StatusAtendimento status);

    void deleteAllByEmpresaLocatariaId(String empresaLocatariaId);

    void deleteAllByLeadId(UUID leadId);
}
