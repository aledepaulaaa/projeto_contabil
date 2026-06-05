package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.core.domain.atendimento.model.Atendimento;
import com.projetocontabil.core.ports.driven.AtendimentoRepository;
import com.projetocontabil.infra.persistence.entity.AtendimentoJpaEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AtendimentoRepositoryAdapter implements AtendimentoRepository {

    private final AtendimentoJpaRepository jpaRepository;

    @Override
    public void save(Atendimento atendimento) {
        AtendimentoJpaEntity entity = new AtendimentoJpaEntity(
            atendimento.getId(),
            atendimento.getLeadId(),
            atendimento.getEmpresaLocatariaId(),
            atendimento.getDepartamentoId(),
            atendimento.getAtendenteId(),
            atendimento.getStatus(),
            atendimento.getCriadoEm(),
            atendimento.getPuxadoEm(),
            atendimento.getEncerradoEm(),
            atendimento.getAtualizadoEm(),
            atendimento.isTransferido(),
            atendimento.isRestritoAdmin()
        );
        jpaRepository.save(entity);
    }

    @Override
    public Optional<Atendimento> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<Atendimento> findAtivoPorLead(UUID leadId) {
        return jpaRepository.findAtendimentoAtivoPorLead(leadId).map(this::toDomain);
    }

    @Override
    public java.util.List<Atendimento> findAllAtivosByEmpresa(String empresaId) {
        return jpaRepository.findAllAtivosByEmpresa(empresaId).stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public java.util.List<Atendimento> findAllByDepartamentoId(UUID departamentoId) {
        return jpaRepository.findAllByDepartamentoId(departamentoId).stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public void deleteAllByEmpresaLocatariaId(String empresaId) {
        jpaRepository.deleteAllByEmpresaLocatariaId(empresaId);
    }

    private Atendimento toDomain(AtendimentoJpaEntity entity) {

        return Atendimento.reconstituir(
            entity.getId(),
            entity.getEmpresaLocatariaId(),
            entity.getLeadId(),
            entity.getDepartamentoId(),
            entity.getAtendenteId(),
            entity.getStatus(),
            entity.getCriadoEm(),
            entity.getPuxadoEm(),
            entity.getEncerradoEm(),
            entity.getAtualizadoEm(),
            entity.isTransferido(),
            entity.isRestritoAdmin()
        );
    }
}
