package com.projetocontabil.infra.persistence.entity;

import com.projetocontabil.core.domain.atendimento.model.StatusAtendimento;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "atendimentos")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AtendimentoJpaEntity {

    @Id
    private UUID id;

    @Column(name = "lead_id")
    private UUID leadId;

    @Column(name = "empresa_locataria_id")
    private String empresaLocatariaId;

    @Column(name = "departamento_id")
    private UUID departamentoId;

    @Column(name = "atendente_id")
    private UUID atendenteId;

    @Enumerated(EnumType.STRING)
    private StatusAtendimento status;

    private LocalDateTime criadoEm;
    private LocalDateTime puxadoEm;
    private LocalDateTime encerradoEm;
    private LocalDateTime atualizadoEm;
    private boolean transferido;
    @Column(name = "restrito_admin")
    private boolean restritoAdmin;

    @PreUpdate
    public void preUpdate() {
        this.atualizadoEm = LocalDateTime.now();
    }
}
