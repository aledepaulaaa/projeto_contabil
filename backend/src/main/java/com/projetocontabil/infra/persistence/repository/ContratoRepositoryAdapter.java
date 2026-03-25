package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.core.domain.crm.model.Contrato;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.ContratoRepository;
import com.projetocontabil.infra.persistence.entity.ContratoJpaEntity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class ContratoRepositoryAdapter implements ContratoRepository {

    private final ContratoJpaRepository jpaRepository;

    public ContratoRepositoryAdapter(ContratoJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Contrato save(Contrato contrato) {
        var entity = toEntity(contrato);
        var salva = jpaRepository.save(entity);
        return toDomain(salva);
    }

    @Override
    public Optional<Contrato> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<Contrato> findByLeadId(UUID leadId) {
        return jpaRepository.findByLeadId(leadId).map(this::toDomain);
    }

    @Override
    public List<Contrato> findAllByEmpresaLocatariaId(EmpresaLocatariaId id) {
        return jpaRepository.findAllByEmpresaLocatariaId(id.value())
                .stream().map(this::toDomain).toList();
    }

    private Contrato toDomain(ContratoJpaEntity entity) {
        return Contrato.reconstituir(
                entity.getId(),
                entity.getLeadId(),
                EmpresaLocatariaId.of(entity.getEmpresaLocatariaId()),
                entity.getStatus(),
                entity.getMotivoCancelamento(),
                entity.getCriadoEm(),
                entity.getAtualizadoEm()
        );
    }

    private ContratoJpaEntity toEntity(Contrato contrato) {
        return new ContratoJpaEntity(
                contrato.getId(),
                contrato.getLeadId(),
                contrato.getEmpresaLocatariaId().value(),
                contrato.getStatus(),
                contrato.getMotivoCancelamento(),
                contrato.getCriadoEm(),
                contrato.getAtualizadoEm()
        );
    }
}
