package com.projetocontabil.infra.messaging;

import com.projetocontabil.core.domain.onboarding.model.TarefaOnboarding;
import com.projetocontabil.core.domain.rotinas.model.Obrigacao;
import com.projetocontabil.core.domain.rotinas.model.TipoObrigacao;
import com.projetocontabil.core.ports.driven.ObrigacaoRepository;
import com.projetocontabil.core.usecases.onboarding.MoverTarefaUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class RotinasIntegrationHandler {

    private final ObrigacaoRepository obrigacaoRepository;

    @EventListener
    public void handleTarefaConcluida(MoverTarefaUseCase.TarefaOnboardingConcluidaEvent event) {
        TarefaOnboarding tarefa = event.tarefa();
        String titulo = tarefa.getTitulo().toUpperCase();

        log.info("[Onboarding -> Rotinas] Analisando tarefa concluída: {}", titulo);

        if (titulo.contains("FISCAL") || titulo.contains("IMPOSTO") || titulo.contains("GUIA")) {
            gerarObrigacoesFiscaisIniciais(event);
        }
        
        if (titulo.contains("FOLHA") || titulo.contains("FUNCIONÁRIO")) {
            gerarObrigacoesTrabalhistasIniciais(event);
        }
    }

    private void gerarObrigacoesFiscaisIniciais(MoverTarefaUseCase.TarefaOnboardingConcluidaEvent event) {
        log.info("[Onboarding -> Rotinas] Gerando obrigações fiscais para o cliente {}", event.onboarding().getLeadId());
        
        // Exemplo: Gerar DAS (Simples Nacional) ou PIS/COFINS
        // Em um sistema real, buscaríamos o regime tributário no Lead/Empresa
        
        Obrigacao das = Obrigacao.reconstituir(
            UUID.randomUUID(),
            event.onboarding().getEmpresaLocatariaId(),
            "Guia DAS - Competência Atual",
            TipoObrigacao.DAS,
            LocalDateTime.now().getMonthValue(),
            LocalDateTime.now().getYear(),
            LocalDateTime.now().withDayOfMonth(20).plusMonths(1),
            Obrigacao.StatusObrigacao.A_FAZER,
            LocalDateTime.now()
        );

        obrigacaoRepository.save(das);
        log.info("[Onboarding -> Rotinas] Obrigação DAS gerada com sucesso.");
    }

    private void gerarObrigacoesTrabalhistasIniciais(MoverTarefaUseCase.TarefaOnboardingConcluidaEvent event) {
        log.info("[Onboarding -> Rotinas] Gerando obrigações trabalhistas para o cliente {}", event.onboarding().getLeadId());
        
        Obrigacao fgts = Obrigacao.reconstituir(
            UUID.randomUUID(),
            event.onboarding().getEmpresaLocatariaId(),
            "FGTS / eSocial - Competência Atual",
            TipoObrigacao.FGTS,
            LocalDateTime.now().getMonthValue(),
            LocalDateTime.now().getYear(),
            LocalDateTime.now().withDayOfMonth(7).plusMonths(1),
            Obrigacao.StatusObrigacao.A_FAZER,
            LocalDateTime.now()
        );

        obrigacaoRepository.save(fgts);
    }
}
