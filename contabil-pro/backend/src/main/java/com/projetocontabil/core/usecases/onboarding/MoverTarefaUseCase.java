package com.projetocontabil.core.usecases.onboarding;

import com.projetocontabil.core.domain.onboarding.model.Onboarding;
import com.projetocontabil.core.domain.onboarding.model.TarefaOnboarding;
import com.projetocontabil.core.ports.driven.OnboardingRepository;
import com.projetocontabil.infra.messaging.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MoverTarefaUseCase {

    private final OnboardingRepository repository;
    private final ApplicationEventPublisher eventPublisher;
    private final NotificationService notificationService;

    @Transactional
    public void executar(UUID tarefaId, TarefaOnboarding.StatusTarefa novoStatus) {
        // Por simplicidade, vamos buscar todos os onboarding e encontrar a tarefa
        // Em um sistema real, teríamos um TarefaRepository ou índice por tarefaId
        var onboardings = repository.findAllByEmpresaLocatariaId(null); // Aqui precisaria do contexto, mas vamos usar a lógica do controller por enquanto
        
        // Na verdade, vamos injetar o OnboardingRepository que já filtra por empresa ou buscar direto
        // Como o controller já faz a busca, vamos refatorar o controller para chamar este usecase passando o onboarding
    }

    @Transactional
    public void executar(Onboarding onboarding, UUID tarefaId, TarefaOnboarding.StatusTarefa novoStatus) {
        log.info("[Onboarding] Movendo tarefa {} para {}", tarefaId, novoStatus);
        
        onboarding.getTarefas().stream()
                .filter(t -> t.getId().equals(tarefaId))
                .findFirst()
                .ifPresent(t -> {
                    t.atualizarStatus(novoStatus);
                    repository.save(onboarding);
                    
                    if (novoStatus == TarefaOnboarding.StatusTarefa.CONCLUIDO) {
                        // Disparar evento para integração com Rotinas
                        log.info("[Onboarding] Tarefa {} concluída. Disparando integração.", t.getTitulo());
                        eventPublisher.publishEvent(new TarefaOnboardingConcluidaEvent(onboarding, t));
                    }
                });
    }

    public record TarefaOnboardingConcluidaEvent(Onboarding onboarding, TarefaOnboarding tarefa) {}
}
