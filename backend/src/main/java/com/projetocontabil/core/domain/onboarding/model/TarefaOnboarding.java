package com.projetocontabil.core.domain.onboarding.model;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
public class TarefaOnboarding {
    private final UUID id;
    private final UUID onboardingId;
    private String titulo;
    private String descricao;
    private StatusTarefa status;
    private PrioridadeTarefa prioridade;
    private List<ItemChecklist> checklist;
    private LocalDateTime dataInicio;
    private LocalDateTime dataFim;

    public enum StatusTarefa {
        A_FAZER,
        EM_ANDAMENTO,
        CONCLUIDO
    }

    public enum PrioridadeTarefa {
        BAIXA,
        MEDIA,
        ALTA,
        URGENTE
    }

    @Getter
    @AllArgsConstructor
    public static class ItemChecklist {
        private final UUID id;
        private String texto;
        private boolean concluido;

        public void alternar() {
            this.concluido = !this.concluido;
        }
    }

    public TarefaOnboarding(UUID id, UUID onboardingId, String titulo, String descricao, 
                             StatusTarefa status, PrioridadeTarefa prioridade, 
                             List<ItemChecklist> checklist,
                             LocalDateTime dataInicio, LocalDateTime dataFim) {
        this.id = id != null ? id : UUID.randomUUID();
        this.onboardingId = onboardingId;
        this.titulo = titulo;
        this.descricao = descricao;
        this.status = status != null ? status : StatusTarefa.A_FAZER;
        this.prioridade = prioridade != null ? prioridade : PrioridadeTarefa.MEDIA;
        this.checklist = checklist != null ? new java.util.ArrayList<>(checklist) : new java.util.ArrayList<>();
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
    }

    public static TarefaOnboarding criar(UUID onboardingId, String titulo, String descricao, 
                                           LocalDateTime inicio, LocalDateTime fim) {
        return new TarefaOnboarding(null, onboardingId, titulo, descricao, StatusTarefa.A_FAZER, 
                                    PrioridadeTarefa.MEDIA, new ArrayList<>(), inicio, fim);
    }

    public void atualizarStatus(StatusTarefa novoStatus) {
        if (novoStatus != null) this.status = novoStatus;
    }

    public void atualizarPrioridade(PrioridadeTarefa novaPrioridade) {
        if (novaPrioridade != null) this.prioridade = novaPrioridade;
    }

    public void atualizarDados(String titulo, String descricao, LocalDateTime inicio, LocalDateTime fim) {
        if (titulo != null) this.titulo = titulo;
        if (descricao != null) this.descricao = descricao;
        this.dataInicio = inicio;
        this.dataFim = fim;
    }

    public void atualizarChecklist(List<ItemChecklist> novosItens) {
        this.checklist.clear();
        if (novosItens != null) {
            this.checklist.addAll(novosItens);
        }
    }
}
