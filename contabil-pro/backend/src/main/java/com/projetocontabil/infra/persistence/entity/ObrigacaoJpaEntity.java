package com.projetocontabil.infra.persistence.entity;

import com.projetocontabil.core.domain.rotinas.model.Obrigacao;
import com.projetocontabil.core.domain.rotinas.model.TipoObrigacao;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "obrigacoes")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ObrigacaoJpaEntity {

    @Id
    private UUID id;

    @Column(name = "empresa_locataria_id")
    private String empresaLocatariaId;

    private String descricao;

    @Enumerated(EnumType.STRING)
    private TipoObrigacao tipo;

    private int mesCompetencia;
    private int anoCompetencia;
    private LocalDateTime dataVencimento;

    @Enumerated(EnumType.STRING)
    private Obrigacao.StatusObrigacao status;

    private String responsavel;
    private LocalDateTime dataHomologacao;
    private String caminhoPdfHomologado;

    private LocalDateTime criadoEm;
}
