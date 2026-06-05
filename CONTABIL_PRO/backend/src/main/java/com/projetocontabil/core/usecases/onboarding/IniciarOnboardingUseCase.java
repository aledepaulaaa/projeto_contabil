package com.projetocontabil.core.usecases.onboarding;

import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.domain.onboarding.model.Onboarding;
import com.projetocontabil.core.domain.onboarding.service.AutoTaskGeneratorService;
import com.projetocontabil.core.ports.driven.OnboardingRepository;
import com.projetocontabil.infra.messaging.NotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class IniciarOnboardingUseCase {

    private final OnboardingRepository onboardingRepository;
    private final NotificationService notificationService;
    private final AutoTaskGeneratorService autoTaskGeneratorService;

    public void executar(Lead lead) {
        log.info("[Onboarding] Iniciando processo para o lead: {} ({})", lead.getNomeContato(), lead.getId());

        // 1. Gerar Resumo IA (Mock por enquanto ou vindo do Lead)
        String resumoIA = lead.getResumoIA() != null ? lead.getResumoIA() : gerarResumoMock(lead);

        // 2. Criar Entidade Onboarding
        Onboarding onboarding = Onboarding.iniciar(lead.getId(), lead.getEmpresaLocatariaId(), resumoIA);

        // 3. Adicionar Tarefas Iniciais via Inteligência de Negócio/IA
        autoTaskGeneratorService.gerarTarefasIniciais(onboarding, lead.getTipoServico(), resumoIA);

        // 4. Salvar
        onboardingRepository.save(onboarding);
        
        // 5. Notificar via WebSocket
        notificationService.notifyTarefaPrazo(
            lead.getEmpresaLocatariaId().value(),
            "Novo Onboarding Iniciado",
            lead.getNomeContato(),
            onboarding.getId().toString()
        );

        log.info("[Onboarding] Processo criado com sucesso para o lead: {}", lead.getId());
    }

    private String gerarResumoMock(Lead lead) {
        return String.format(
            "### Resumo da Conversa Comercial - %s\n\n" +
            "**Contexto:** Cliente interessado em %s.\n" +
            "**Dores Identificadas:** Necessidade de agilidade no processo e suporte consultivo.\n" +
            "**Obrigações Mapeadas:** Envio de guias mensais e acompanhamento de folha.\n" +
            "**Observação:** O cliente demonstrou preocupação com prazos de transição.",
            lead.getNomeEmpresa(),
            lead.getTipoServico() != null ? lead.getTipoServico().name() : "SERVIÇOS GERAIS"
        );
    }
}
