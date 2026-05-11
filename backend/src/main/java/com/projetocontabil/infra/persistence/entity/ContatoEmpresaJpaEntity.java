package com.projetocontabil.infra.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.util.UUID;

@Entity
@Table(name = "empresa_contatos")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ContatoEmpresaJpaEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id")
    private EmpresaJpaEntity empresa;

    private String nome;
    private String cargo;
    private String departamento;
    private String celular;
    private String email;
}
