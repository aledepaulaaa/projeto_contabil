package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.domain.empresalocataria.model.EmpresaLocataria;
import com.projetocontabil.core.ports.driven.EmpresaLocatariaRepository;
import com.projetocontabil.infra.persistence.entity.EmpresaLocatariaJpaEntity;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class EmpresaLocatariaRepositoryAdapter implements EmpresaLocatariaRepository {

    private final EmpresaLocatariaJpaRepository jpaRepository;

    public EmpresaLocatariaRepositoryAdapter(EmpresaLocatariaJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<EmpresaLocataria> findByEmpresaLocatariaId(EmpresaLocatariaId id) {
        return jpaRepository.findByEmpresaId(id.value())
                .map(this::toDomain);
    }

    @Override
    public EmpresaLocataria save(EmpresaLocataria empresa) {
        var entity = toEntity(empresa);
        var salva = jpaRepository.save(entity);
        return toDomain(salva);
    }

    private EmpresaLocataria toDomain(EmpresaLocatariaJpaEntity entity) {
        return EmpresaLocataria.reconstituir(
                UUID.fromString(entity.getId()),
                EmpresaLocatariaId.of(entity.getEmpresaId()),
                entity.getNome(),
                entity.getCnpj(),
                entity.getRegime(),
                entity.getCriadoEm(),
                entity.getDataFimTrial()
        );
    }

    private EmpresaLocatariaJpaEntity toEntity(EmpresaLocataria empresa) {
        return new EmpresaLocatariaJpaEntity(
                empresa.getId().toString(),
                empresa.getEmpresaId().value(),
                empresa.getNome(),
                empresa.getCnpj(),
                empresa.getRegimeTributario(),
                empresa.getCriadoEm(),
                empresa.getDataFimTrial()
        );
    }
}
