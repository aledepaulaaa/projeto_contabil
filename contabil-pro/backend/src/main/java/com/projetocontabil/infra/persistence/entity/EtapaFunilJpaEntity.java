package com.projetocontabil.infra.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.util.UUID;

@Entity
@Table(name = "etapas_funil")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EtapaFunilJpaEntity {

    @Id
    private UUID id;

    @Column(name = "empresa_locataria_id", nullable = false)
    private String empresaLocatariaId;

    @Column(nullable = false)
    private String chave;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private Integer ordem;

    private String cor;
}
