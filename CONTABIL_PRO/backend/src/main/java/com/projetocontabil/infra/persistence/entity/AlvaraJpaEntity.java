package com.projetocontabil.infra.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "alvaras")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AlvaraJpaEntity {

    @Id
    private UUID id;

    @Column(name = "empresa_locataria_id")
    private String empresaLocatariaId;

    private String numeroAlvara;
    private String tipo;
    private LocalDate dataEmissao;
    private LocalDate dataVencimento;
    private String status;
    private LocalDateTime criadoEm;
}
