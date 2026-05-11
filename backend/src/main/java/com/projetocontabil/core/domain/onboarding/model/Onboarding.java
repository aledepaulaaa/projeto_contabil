package com.projetocontabil.core.domain.onboarding.model;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.domain.shared.AggregateRoot;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
public class Onboarding extends AggregateRoot {
    private final UUID leadId;
    private final EmpresaLocatariaId empresaLocatariaId;
    private String resumoIA;
    private StatusOnboarding status;
    private final List<TarefaOnboarding> tarefas;
    private final LocalDateTime criadoEm;

    private Onboarding(UUID id, UUID leadId, EmpresaLocatariaId empresaLocatariaId, 
                       String resumoIA, StatusOnboarding status, List<TarefaOnboarding> tarefas, 
                       LocalDateTime criadoEm) {
        super(id);
        this.leadId = leadId;
        this.empresaLocatariaId = empresaLocatariaId;
        this.resumoIA = resumoIA;
        this.status = status;
        this.tarefas = tarefas != null ? tarefas : new ArrayList<>();
        this.criadoEm = criadoEm;
    }

    public static Onboarding iniciar(UUID leadId, EmpresaLocatariaId empresaLocatariaId, String resumoIAInicial) {
        return new Onboarding(
            UUID.randomUUID(),
            leadId,
            empresaLocatariaId,
            resumoIAInicial,
            StatusOnboarding.AGUARDANDO_PARAMETRIZACAO,
            new ArrayList<>(),
            LocalDateTime.now()
        );
    }

    public static Onboarding reconstituir(UUID id, UUID leadId, EmpresaLocatariaId empresaId, 
                                          String resumo, StatusOnboarding status, 
                                          List<TarefaOnboarding> tarefas, LocalDateTime criado) {
        return new Onboarding(id, leadId, empresaId, resumo, status, tarefas, criado);
    }

    public void atualizarResumo(String novoResumo) {
        if (novoResumo == null || novoResumo.isBlank()) {
            throw new IllegalArgumentException("O resumo da IA não pode ser vazio.");
        }
        this.resumoIA = novoResumo;
    }

    public void adicionarTarefa(TarefaOnboarding tarefa) {
        this.tarefas.add(tarefa);
    }

    public void removerTarefa(UUID tarefaId) {
        this.tarefas.removeIf(t -> t.getId().equals(tarefaId));
    }

    public void avancarStatus() {
        if (this.status == StatusOnboarding.AGUARDANDO_PARAMETRIZACAO) {
            this.status = StatusOnboarding.EM_ADOCAO;
        } else if (this.status == StatusOnboarding.EM_ADOCAO) {
            this.status = StatusOnboarding.IMPLANTADO;
        }
    }
}
