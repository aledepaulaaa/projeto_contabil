package com.projetocontabil.infra.persistence.adapter;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.domain.onboarding.model.Onboarding;
import com.projetocontabil.core.domain.onboarding.model.TarefaOnboarding;
import com.projetocontabil.core.ports.driven.OnboardingRepository;
import com.projetocontabil.infra.persistence.entity.OnboardingJpaEntity;
import com.projetocontabil.infra.persistence.entity.TarefaOnboardingJpaEntity;
import com.projetocontabil.infra.persistence.repository.SpringDataOnboardingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class OnboardingRepositoryAdapter implements OnboardingRepository {

    private final SpringDataOnboardingRepository repository;

    @Override
    public Onboarding save(Onboarding domain) {
        OnboardingJpaEntity entity = repository.findById(domain.getId())
                .orElse(new OnboardingJpaEntity());
        
        updateEntityFromDomain(entity, domain);
        
        OnboardingJpaEntity saved = repository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<Onboarding> findById(UUID id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<Onboarding> findByLeadId(UUID leadId) {
        return repository.findByLeadId(leadId).map(this::toDomain);
    }

    @Override
    public List<Onboarding> findAllByEmpresaLocatariaId(EmpresaLocatariaId empresaId) {
        return repository.findAllByEmpresaLocatariaId(empresaId.value()).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteById(UUID id) {
        repository.deleteById(id);
    }

    private void updateEntityFromDomain(OnboardingJpaEntity entity, Onboarding domain) {
        entity.setId(domain.getId());
        entity.setLeadId(domain.getLeadId());
        entity.setEmpresaLocatariaId(domain.getEmpresaLocatariaId().value());
        entity.setResumoIA(domain.getResumoIA());
        entity.setStatus(domain.getStatus());
        entity.setCriadoEm(domain.getCriadoEm());

        // Atualizar tarefas
        List<TarefaOnboardingJpaEntity> currentTarefas = entity.getTarefas();
        List<TarefaOnboarding> domainTarefas = domain.getTarefas();

        // Remover órfãos
        currentTarefas.removeIf(ct -> domainTarefas.stream().noneMatch(dt -> dt.getId().equals(ct.getId())));

        // Atualizar existentes ou adicionar novas
        for (TarefaOnboarding dt : domainTarefas) {
            TarefaOnboardingJpaEntity target = currentTarefas.stream()
                    .filter(ct -> ct.getId().equals(dt.getId()))
                    .findFirst()
                    .orElseGet(() -> {
                        TarefaOnboardingJpaEntity newT = new TarefaOnboardingJpaEntity();
                        newT.setId(dt.getId());
                        newT.setOnboardingId(domain.getId());
                        currentTarefas.add(newT);
                        return newT;
                    });
            
            target.setTitulo(dt.getTitulo());
            target.setDescricao(dt.getDescricao());
            target.setStatus(dt.getStatus());
            target.setPrioridade(dt.getPrioridade());
            target.setDataInicio(dt.getDataInicio());
            target.setDataFim(dt.getDataFim());

            // Atualizar checklist (ElementCollection)
            target.getChecklist().clear();
            target.getChecklist().addAll(dt.getChecklist().stream()
                    .map(item -> new TarefaOnboardingJpaEntity.ItemChecklistEmbeddable(item.getId(), item.getTexto(), item.isConcluido()))
                    .collect(Collectors.toList()));
        }
    }

    private Onboarding toDomain(OnboardingJpaEntity entity) {
        List<TarefaOnboarding> tarefas = entity.getTarefas().stream()
                .map(t -> {
                    List<TarefaOnboarding.ItemChecklist> checklist = t.getChecklist().stream()
                            .map(item -> new TarefaOnboarding.ItemChecklist(item.getId(), item.getTexto(), item.isConcluido()))
                            .collect(Collectors.toList());

                    return new TarefaOnboarding(
                        t.getId(), 
                        t.getOnboardingId(), 
                        t.getTitulo(), 
                        t.getDescricao(), 
                        t.getStatus(),
                        t.getPrioridade(),
                        checklist,
                        t.getDataInicio(), 
                        t.getDataFim()
                    );
                })
                .collect(Collectors.toList());

        return Onboarding.reconstituir(
                entity.getId(),
                entity.getLeadId(),
                EmpresaLocatariaId.of(entity.getEmpresaLocatariaId()),
                entity.getResumoIA(),
                entity.getStatus(),
                tarefas,
                entity.getCriadoEm()
        );
    }
}
