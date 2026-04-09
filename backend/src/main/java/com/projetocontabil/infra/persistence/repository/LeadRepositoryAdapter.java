package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.domain.crm.model.StatusLead;
import com.projetocontabil.core.domain.crm.vo.Email;
import com.projetocontabil.core.domain.crm.vo.Identificacao;
import com.projetocontabil.core.domain.crm.vo.Telefone;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.LeadRepository;
import com.projetocontabil.infra.persistence.entity.LeadJpaEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class LeadRepositoryAdapter implements LeadRepository {


    private final LeadJpaRepository jpaRepository;

    @Override
    @Transactional
    public Lead save(Lead lead) {
        log.info("REPOSITORY: Salvando lead {}. Telefone no domínio: {}", lead.getId(), lead.getTelefone() != null ? lead.getTelefone().value() : "NULL");
        var entity = toEntity(lead);
        var salva = jpaRepository.save(entity);
        return toDomain(salva);
    }

    @Override
    public Optional<Lead> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<Lead> findByTelefone(String telefone) {
        return jpaRepository.findByTelefone(telefone).map(this::toDomain);
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
                safeEmail(entity.getEmail()),
                safeTelefone(entity.getTelefone()),
                safeIdentificacao(entity.getCnpj()),
                entity.getNomeEmpresa(),
                entity.getStatus(),
                entity.getOrigemLead(),
                entity.getTipoServico(),
                entity.getObservacaoNaoFechamento(),
                entity.getGoogleLeadId(),
                entity.getCriadoEm(),
                entity.getQuantidadeMensagensNaoLidas() != null ? entity.getQuantidadeMensagensNaoLidas() : 0
        );
    }

    private Email safeEmail(String email) {
        if (email == null || email.isBlank() || !email.contains("@")) return null;
        try {
            return new Email(email);
        } catch (Exception e) {
            return null;
        }
    }

    private Telefone safeTelefone(String fone) {
        if (fone == null || fone.isBlank() || fone.length() < 10) return null;
        try {
            return new Telefone(fone);
        } catch (Exception e) {
            return null;
        }
    }

    private Identificacao safeIdentificacao(String cnpj) {
        if (cnpj == null || cnpj.isBlank()) return null;
        String digits = cnpj.replaceAll("\\D", "");
        if (digits.length() != 11 && digits.length() != 14) return null;
        try {
            return new Identificacao(cnpj);
        } catch (Exception e) {
            return null;
        }
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
        entity.setObservacaoNaoFechamento(lead.getObservacaoNaoFechamento());
        entity.setQuantidadeMensagensNaoLidas(lead.getQuantidadeMensagensNaoLidas());
        return entity;
    }
}
