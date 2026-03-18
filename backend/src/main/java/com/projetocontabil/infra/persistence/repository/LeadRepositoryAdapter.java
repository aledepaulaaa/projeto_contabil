package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.domain.crm.model.StatusLead;
import com.projetocontabil.core.domain.crm.vo.Email;
import com.projetocontabil.core.domain.crm.vo.Identificacao;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.LeadRepository;
import com.projetocontabil.infra.persistence.entity.LeadJpaEntity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class LeadRepositoryAdapter implements LeadRepository {

    private final LeadJpaRepository jpaRepository;

    public LeadRepositoryAdapter(LeadJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Lead save(Lead lead) {
        var entity = toEntity(lead);
        var salva = jpaRepository.save(entity);
        return toDomain(salva);
    }

    @Override
    public Optional<Lead> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public List<Lead> findAllByEmpresaLocatariaId(EmpresaLocatariaId id) {
        return jpaRepository.findAllByEmpresaLocatariaId(id.value())
                .stream().map(this::toDomain).toList();
    }

    @Override
    public boolean existsByIdentificacaoAndEmpresaLocatariaId(Identificacao identificacao, EmpresaLocatariaId id) {
        return jpaRepository.existsByCnpjAndEmpresaLocatariaId(identificacao.value(), id.value());
    }

    @Override
    public long countByEmpresaLocatariaIdAndStatus(EmpresaLocatariaId id, StatusLead status) {
        return jpaRepository.countByEmpresaLocatariaIdAndStatus(id.value(), status);
    }

    private Lead toDomain(LeadJpaEntity entity) {
        return Lead.reconstituir(
                entity.getId(),
                EmpresaLocatariaId.of(entity.getEmpresaLocatariaId()),
                entity.getNomeContato(),
                entity.getEmail() != null ? new Email(entity.getEmail()) : null,
                null, // Telefone não mapeado no MVP
                new Identificacao(entity.getCnpj()),
                entity.getNomeEmpresa(),
                entity.getStatus(),
                entity.getCriadoEm()
        );
    }

    private LeadJpaEntity toEntity(Lead lead) {
        return new LeadJpaEntity(
                lead.getId(),
                lead.getEmpresaLocatariaId().value(),
                lead.getNomeContato(),
                lead.getEmail() != null ? lead.getEmail().value() : null,
                lead.getIdentificacao().value(),
                lead.getNomeEmpresa(),
                lead.getStatus(),
                lead.getCriadoEm()
        );
    }
}
