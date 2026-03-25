package com.projetocontabil.infra.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade JPA para a tabela historico_vida_lead.
 * A coluna 'eventos' armazena o histórico como JSONB (TEXT no JPA, convertido na camada de adapter).
 */
@Entity
@Table(name = "historico_vida_lead")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HistoricoVidaLeadJpaEntity {

    @Id
    private UUID id;

    @Column(name = "lead_id", nullable = false)
    private UUID leadId;

    @Column(name = "empresa_locataria_id", nullable = false)
    private String empresaLocatariaId;

    /**
     * Coluna JSONB no PostgreSQL.
     * Armazena a lista de eventos serializada como JSON.
     */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String eventos;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;
}
