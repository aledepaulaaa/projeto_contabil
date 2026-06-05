package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.core.domain.usuario.model.ConviteUsuario;
import com.projetocontabil.core.domain.usuario.model.Papel;
import com.projetocontabil.core.domain.usuario.model.Permissao;
import com.projetocontabil.core.ports.driven.ConviteRepository;
import com.projetocontabil.infra.persistence.entity.ConviteJpaEntity;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class ConviteRepositoryAdapter implements ConviteRepository {

    private final ConviteJpaRepository jpaRepository;

    public ConviteRepositoryAdapter(ConviteJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public ConviteUsuario save(ConviteUsuario convite) {
        var entity = toEntity(convite);
        jpaRepository.save(entity);
        return convite;
    }

    @Override
    public Optional<ConviteUsuario> findByToken(String token) {
        return jpaRepository.findByToken(token).map(this::toDomain);
    }

    @Override
    public List<ConviteUsuario> findAllByEmpresaLocatariaId(String empresaLocatariaId) {
        return jpaRepository.findAllByEmpresaLocatariaId(empresaLocatariaId)
                .stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public void deleteByToken(String token) {
        jpaRepository.deleteByToken(token);
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public boolean existsByEmailAndEmpresaLocatariaId(String email, String empresaLocatariaId) {
        return jpaRepository.existsByEmailAndEmpresaLocatariaId(email, empresaLocatariaId);
    }

    private ConviteUsuario toDomain(ConviteJpaEntity entity) {
        return new ConviteUsuario(
                entity.getId(), entity.getEmpresaLocatariaId(), entity.getEmail(),
                entity.getNome(), Papel.valueOf(entity.getPapel()),
                EnumSet.noneOf(Permissao.class), entity.getDepartamentoId(),
                entity.getToken(), entity.getCriadoEm(), entity.getExpiraEm(),
                entity.getConvidadoPor()
        );
    }

    private ConviteJpaEntity toEntity(ConviteUsuario domain) {
        var entity = new ConviteJpaEntity();
        entity.setId(domain.getId());
        entity.setEmpresaLocatariaId(domain.getEmpresaLocatariaId());
        entity.setEmail(domain.getEmail());
        entity.setNome(domain.getNome());
        entity.setPapel(domain.getPapel().name());
        entity.setDepartamentoId(domain.getDepartamentoId());
        entity.setToken(domain.getToken());
        entity.setCriadoEm(domain.getCriadoEm());
        entity.setExpiraEm(domain.getExpiraEm());
        entity.setConvidadoPor(domain.getConvidadoPor());
        return entity;
    }
}
