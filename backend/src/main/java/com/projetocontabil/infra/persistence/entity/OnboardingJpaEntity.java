package com.projetocontabil.infra.persistence.entity;

import com.projetocontabil.core.domain.onboarding.model.StatusOnboarding;
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
@Table(name = "onboarding")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingJpaEntity {

    @Id
    private UUID id;

    @Column(name = "empresa_locataria_id")
    private String empresaLocatariaId;

    @Column(name = "lead_id")
    private UUID leadId;

    @Column(name = "resumo_ia", columnDefinition = "TEXT")
    private String resumoIA;

    @Enumerated(EnumType.STRING)
    private StatusOnboarding status;

    @OneToMany(mappedBy = "onboardingId", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<TarefaOnboardingJpaEntity> tarefas = new ArrayList<>();

    @Column(name = "criado_em")
    private LocalDateTime criadoEm;
}
