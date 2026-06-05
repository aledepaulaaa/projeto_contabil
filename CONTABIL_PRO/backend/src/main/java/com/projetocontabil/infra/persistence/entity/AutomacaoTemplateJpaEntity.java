package com.projetocontabil.infra.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "automacao_templates")
@Getter
@Setter
@Audited
public class AutomacaoTemplateJpaEntity {

    @Id
    private UUID id;

    @Column(name = "empresa_locataria_id", nullable = false, length = 50)
    private String empresaLocatariaId;

    @Column(name = "gatilho", nullable = false, length = 50)
    private String gatilho;

    @Column(name = "texto", nullable = false, columnDefinition = "TEXT")
    private String texto;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;
}
