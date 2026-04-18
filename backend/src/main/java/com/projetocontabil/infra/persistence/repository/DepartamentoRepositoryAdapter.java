package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.core.domain.departamento.model.Departamento;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.DepartamentoRepository;
import com.projetocontabil.infra.persistence.entity.DepartamentoJpaEntity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class DepartamentoRepositoryAdapter implements DepartamentoRepository {

    private final DepartamentoJpaRepository jpaRepository;

    public DepartamentoRepositoryAdapter(DepartamentoJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Departamento save(Departamento departamento) {
        var entity = toEntity(departamento);
        var saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<Departamento> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public List<Departamento> findAllByEmpresaLocatariaId(EmpresaLocatariaId empresaId) {
        return jpaRepository.findAllByEmpresaLocatariaId(empresaId.value())
                .stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public boolean existsByNomeAndEmpresaLocatariaId(String nome, String empresaLocatariaId) {
        return jpaRepository.existsByNomeAndEmpresaLocatariaId(nome, empresaLocatariaId);
    }

    @Override
    public Optional<Departamento> findByNomeAndEmpresaLocatariaId(String nome, String empresaLocatariaId) {
        return jpaRepository.findByNomeAndEmpresaLocatariaId(nome, empresaLocatariaId).map(this::toDomain);
    }

    private Departamento toDomain(DepartamentoJpaEntity entity) {
        return Departamento.reconstituir(entity.getId(), entity.getEmpresaLocatariaId(),
                entity.getNome(), entity.getDescricao(), entity.getCriadoEm());
    }

    private DepartamentoJpaEntity toEntity(Departamento domain) {
        var entity = new DepartamentoJpaEntity();
        entity.setId(domain.getId());
        entity.setEmpresaLocatariaId(domain.getEmpresaLocatariaId());
        entity.setNome(domain.getNome());
        entity.setDescricao(domain.getDescricao());
        entity.setCriadoEm(domain.getCriadoEm());
        return entity;
    }


}
