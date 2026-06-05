package com.projetocontabil.core.domain.onboarding.service;

import com.projetocontabil.core.domain.crm.model.TipoServico;
import com.projetocontabil.core.domain.onboarding.model.Onboarding;
import com.projetocontabil.core.domain.onboarding.model.TarefaOnboarding;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class AutoTaskGeneratorService {

    public void gerarTarefasIniciais(Onboarding onboarding, TipoServico tipoServico, String resumoIA) {
        log.info("[Onboarding-IA] Gerando tarefas automáticas para onboarding {} baseadas no resumo.", onboarding.getId());
        
        UUID oid = onboarding.getId();
        String resumoUpper = resumoIA.toUpperCase();

        // 1. Tarefas Base (Sempre presentes)
        onboarding.adicionarTarefa(TarefaOnboarding.criar(oid, "Coleta de Documentos Iniciais", 
            "Solicitar documentação básica conforme mapeado no comercial.", 
            LocalDateTime.now(), LocalDateTime.now().plusDays(2)));

        // 2. Inteligência baseada no Tipo de Serviço
        if (tipoServico == TipoServico.ABERTURA || resumoUpper.contains("ABERTURA")) {
            onboarding.adicionarTarefa(new TarefaOnboarding(null, oid, "Viabilidade na Junta Comercial",
                "Realizar consulta de viabilidade de nome e endereço.", 
                TarefaOnboarding.StatusTarefa.A_FAZER, TarefaOnboarding.PrioridadeTarefa.ALTA, 
                criarChecklistAbertura(), LocalDateTime.now(), LocalDateTime.now().plusDays(3)));
        }

        if (tipoServico == TipoServico.TRANSFERENCIA || resumoUpper.contains("MIGRAÇÃO") || resumoUpper.contains("TRANSFERÊNCIA")) {
            onboarding.adicionarTarefa(new TarefaOnboarding(null, oid, "Backup de Sistemas Anteriores",
                "Solicitar exportação de dados do contador anterior (Domínio, Alterdata, etc).", 
                TarefaOnboarding.StatusTarefa.A_FAZER, TarefaOnboarding.PrioridadeTarefa.URGENTE, 
                criarChecklistMigracao(), LocalDateTime.now(), LocalDateTime.now().plusDays(5)));
        }

        // 3. Inteligência baseada em Palavras-Chave no Resumo
        if (resumoUpper.contains("GUIA") || resumoUpper.contains("IMPOSTO") || resumoUpper.contains("FISCAL")) {
            onboarding.adicionarTarefa(new TarefaOnboarding(null, oid, "Configuração de Parâmetros Fiscais",
                "Configurar alíquotas e impostos no sistema contábil.", 
                TarefaOnboarding.StatusTarefa.A_FAZER, TarefaOnboarding.PrioridadeTarefa.ALTA, 
                new ArrayList<>(), LocalDateTime.now().plusDays(2), LocalDateTime.now().plusDays(4)));
        }

        if (resumoUpper.contains("FOLHA") || resumoUpper.contains("TRABALHISTA") || resumoUpper.contains("FUNCIONÁRIO")) {
            onboarding.adicionarTarefa(new TarefaOnboarding(null, oid, "Parametrização de Folha de Pagamento",
                "Cadastrar funcionários e configurar eventos de folha.", 
                TarefaOnboarding.StatusTarefa.A_FAZER, TarefaOnboarding.PrioridadeTarefa.MEDIA, 
                new ArrayList<>(), LocalDateTime.now().plusDays(3), LocalDateTime.now().plusDays(6)));
        }
        
        onboarding.adicionarTarefa(TarefaOnboarding.criar(oid, "Reunião de Alinhamento Final", 
            "Validar implantação com o cliente e liberar acesso ao portal.", 
            LocalDateTime.now().plusDays(7), LocalDateTime.now().plusDays(10)));
    }

    private List<TarefaOnboarding.ItemChecklist> criarChecklistAbertura() {
        List<TarefaOnboarding.ItemChecklist> list = new ArrayList<>();
        list.add(new TarefaOnboarding.ItemChecklist(UUID.randomUUID(), "Consulta de Viabilidade", false));
        list.add(new TarefaOnboarding.ItemChecklist(UUID.randomUUID(), "Elaboração do Contrato Social", false));
        list.add(new TarefaOnboarding.ItemChecklist(UUID.randomUUID(), "Assinatura dos Sócios", false));
        list.add(new TarefaOnboarding.ItemChecklist(UUID.randomUUID(), "Protocolo na Junta", false));
        return list;
    }

    private List<TarefaOnboarding.ItemChecklist> criarChecklistMigracao() {
        List<TarefaOnboarding.ItemChecklist> list = new ArrayList<>();
        list.add(new TarefaOnboarding.ItemChecklist(UUID.randomUUID(), "Termo de Transferência de Responsabilidade", false));
        list.add(new TarefaOnboarding.ItemChecklist(UUID.randomUUID(), "Backup do Plano de Contas", false));
        list.add(new TarefaOnboarding.ItemChecklist(UUID.randomUUID(), "Certificado Digital A1", false));
        return list;
    }
}
