package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.domain.crm.model.StatusLead;
import com.projetocontabil.core.domain.crm.vo.Email;
import com.projetocontabil.core.domain.crm.vo.Identificacao;
import com.projetocontabil.core.domain.crm.vo.Telefone;
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

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }

    private Lead toDomain(LeadJpaEntity entity) {
        return Lead.reconstituir(
                entity.getId(),
                EmpresaLocatariaId.of(entity.getEmpresaLocatariaId()),
                entity.getNomeContato(),
                entity.getEmail() != null ? new Email(entity.getEmail()) : null,
                entity.getTelefone() != null ? new Telefone(entity.getTelefone()) : null,
                entity.getCnpj() != null ? new Identificacao(entity.getCnpj()) : null,
                entity.getNomeEmpresa(),
                entity.getStatus(),
                entity.getOrigemLead(),
                entity.getTipoServico(),
                entity.getGoogleLeadId(),
                entity.getCriadoEm()
        );
    }

    private LeadJpaEntity toEntity(Lead lead) {
        var entity = new LeadJpaEntity();
        entity.setId(lead.getId());
        entity.setEmpresaLocatariaId(lead.getEmpresaLocatariaId().value());
        entity.setNomeContato(lead.getNomeContato());
        entity.setEmail(lead.getEmail() != null ? lead.getEmail().value() : null);
        entity.setTelefone(lead.getTelefone() != null ? lead.getTelefone().value() : null);
        entity.setCnpj(lead.getIdentificacao() != null ? lead.getIdentificacao().value() : null);
        entity.setNomeEmpresa(lead.getNomeEmpresa());
        entity.setStatus(lead.getStatus());
        entity.setOrigemLead(lead.getOrigemLead());
        entity.setTipoServico(lead.getTipoServico());
        entity.setCriadoEm(lead.getCriadoEm());
        entity.setGoogleLeadId(lead.getGoogleLeadId());
        return entity;
    }
}
