package com.projetocontabil.infra.persistence.entity;

import com.projetocontabil.core.domain.onboarding.model.TarefaOnboarding;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "onboarding_tarefas")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TarefaOnboardingJpaEntity {

    @Id
    private UUID id;

    @Column(name = "onboarding_id")
    private UUID onboardingId;

    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Enumerated(EnumType.STRING)
    private TarefaOnboarding.StatusTarefa status;

    @Enumerated(EnumType.STRING)
    private TarefaOnboarding.PrioridadeTarefa prioridade;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "onboarding_tarefa_checklist", joinColumns = @JoinColumn(name = "tarefa_id"))
    private List<ItemChecklistEmbeddable> checklist = new ArrayList<>();

    @Column(name = "data_inicio")
    private LocalDateTime dataInicio;

    @Column(name = "data_fim")
    private LocalDateTime dataFim;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemChecklistEmbeddable {
        private UUID id;
        private String texto;
        private boolean concluido;
    }
}
