package com.projetocontabil.infra.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "anotacoes_contato")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AnotacaoContatoJpaEntity {

    @Id
    private UUID id;

    @Column(name = "contato_id", nullable = false)
    private UUID contatoId;

    @Column(name = "empresa_locataria_id", nullable = false)
    private String empresaLocatariaId;

    private String autor;

    private String setor;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String conteudo;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;
}
