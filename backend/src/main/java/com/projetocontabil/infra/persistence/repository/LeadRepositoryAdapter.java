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

    @Override
    public Optional<Lead> findByGoogleLeadId(String googleLeadId) {
        return jpaRepository.findByGoogleLeadId(googleLeadId).map(this::toDomain);
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
                entity.getOrigemLead(),
                entity.getTipoServico(),
                entity.getCriadoEm()
        );
    }

    private LeadJpaEntity toEntity(Lead lead) {
        var entity = new LeadJpaEntity();
        entity.setId(lead.getId());
        entity.setEmpresaLocatariaId(lead.getEmpresaLocatariaId().value());
        entity.setNomeContato(lead.getNomeContato());
        entity.setEmail(lead.getEmail() != null ? lead.getEmail().value() : null);
        entity.setCnpj(lead.getIdentificacao().value());
        entity.setNomeEmpresa(lead.getNomeEmpresa());
        entity.setStatus(lead.getStatus());
        entity.setOrigemLead(lead.getOrigemLead());
        entity.setTipoServico(lead.getTipoServico());
        entity.setCriadoEm(lead.getCriadoEm());
        // Se o domínio for extendido no futuro com googleLeadId, adicionar aqui
        return entity;
    }
}
