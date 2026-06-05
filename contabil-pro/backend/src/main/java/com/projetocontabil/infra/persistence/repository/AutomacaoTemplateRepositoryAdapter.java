package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.core.domain.crm.model.AutomacaoTemplate;
import com.projetocontabil.core.domain.crm.model.StatusLead;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.AutomacaoTemplateRepository;
import com.projetocontabil.infra.persistence.entity.AutomacaoTemplateJpaEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class AutomacaoTemplateRepositoryAdapter implements AutomacaoTemplateRepository {

    private final AutomacaoTemplateJpaRepository jpaRepository;

    @Override
    public List<AutomacaoTemplate> findAllByEmpresaLocatariaId(EmpresaLocatariaId empresaId) {
        return jpaRepository.findAllByEmpresaLocatariaId(empresaId.value()).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<AutomacaoTemplate> findByEmpresaAndGatilho(EmpresaLocatariaId empresaId, StatusLead gatilho) {
        return jpaRepository.findByEmpresaLocatariaIdAndGatilho(empresaId.value(), gatilho.name())
                .map(this::toDomain);
    }

    @Override
    public AutomacaoTemplate save(AutomacaoTemplate template) {
        var entity = new AutomacaoTemplateJpaEntity();
        entity.setId(template.getId());
        entity.setEmpresaLocatariaId(template.getEmpresaLocatariaId().value());
        entity.setGatilho(template.getGatilho().name());
        entity.setTexto(template.getTexto());
        entity.setCriadoEm(template.getAtualizadoEm() != null ? template.getAtualizadoEm() : LocalDateTime.now());
        entity.setAtualizadoEm(template.getAtualizadoEm());

        jpaRepository.save(entity);
        return template;
    }

    private AutomacaoTemplate toDomain(AutomacaoTemplateJpaEntity entity) {
        return AutomacaoTemplate.reconstruir(
                entity.getId(),
                EmpresaLocatariaId.of(entity.getEmpresaLocatariaId()),
                StatusLead.valueOf(entity.getGatilho()),
                entity.getTexto(),
                entity.getAtualizadoEm()
        );
    }
}
