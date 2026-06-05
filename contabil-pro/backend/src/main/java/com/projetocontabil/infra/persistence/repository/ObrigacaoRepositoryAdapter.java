package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.core.domain.rotinas.model.Obrigacao;
import com.projetocontabil.core.domain.rotinas.model.TipoObrigacao;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.ObrigacaoRepository;
import com.projetocontabil.infra.persistence.entity.ObrigacaoJpaEntity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class ObrigacaoRepositoryAdapter implements ObrigacaoRepository {

    private final ObrigacaoJpaRepository jpaRepository;

    public ObrigacaoRepositoryAdapter(ObrigacaoJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Obrigacao save(Obrigacao obrigacao) {
        var entity = toEntity(obrigacao);
        var salva = jpaRepository.save(entity);
        return toDomain(salva);
    }

    @Override
    public Optional<Obrigacao> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public List<Obrigacao> findPendentesByEmpresaLocatariaId(EmpresaLocatariaId id) {
        return jpaRepository.findAllByEmpresaLocatariaId(id.value()).stream()
                .map(this::toDomain)
                .filter(o -> o.getStatus() == Obrigacao.StatusObrigacao.A_FAZER || o.getStatus() == Obrigacao.StatusObrigacao.AGUARDANDO_ENVIO)
                .toList();
    }

    @Override
    public List<Obrigacao> findAllByEmpresaLocatariaId(EmpresaLocatariaId id) {
        return jpaRepository.findAllByEmpresaLocatariaId(id.value()).stream()
                .map(this::toDomain).toList();
    }

    @Override
    public long countByEmpresaLocatariaIdAndStatus(EmpresaLocatariaId id, Obrigacao.StatusObrigacao status) {
        return jpaRepository.countByEmpresaLocatariaIdAndStatus(id.value(), status);
    }

    @Override
    public List<Obrigacao> findAllByEmpresaLocatariaIdAndCompetence(EmpresaLocatariaId id, int mes, int ano) {
        return jpaRepository.findAllByEmpresaLocatariaIdAndMesCompetenciaAndAnoCompetencia(id.value(), mes, ano)
                .stream().map(this::toDomain).toList();
    }

    private Obrigacao toDomain(ObrigacaoJpaEntity entity) {
        var obrigacao = Obrigacao.reconstituir(
                entity.getId(),
                EmpresaLocatariaId.of(entity.getEmpresaLocatariaId()),
                entity.getDescricao(),
                entity.getTipo(),
                entity.getMesCompetencia(),
                entity.getAnoCompetencia(),
                entity.getDataVencimento(),
                entity.getStatus(),
                entity.getCriadoEm()
        );
        
        if (entity.getResponsavel() != null) {
            obrigacao.homologar(entity.getResponsavel(), entity.getCaminhoPdfHomologado());
        }
        
        return obrigacao;
    }

    private ObrigacaoJpaEntity toEntity(Obrigacao obrigacao) {
        return new ObrigacaoJpaEntity(
                obrigacao.getId(),
                obrigacao.getEmpresaLocatariaId().value(),
                obrigacao.getDescricao(),
                obrigacao.getTipo(),
                obrigacao.getMesCompetencia(),
                obrigacao.getAnoCompetencia(),
                obrigacao.getDataVencimento(),
                obrigacao.getStatus(),
                obrigacao.getResponsavel(),
                obrigacao.getDataHomologacao(),
                obrigacao.getCaminhoPdfHomologado(),
                obrigacao.getCriadoEm()
        );
    }
}
