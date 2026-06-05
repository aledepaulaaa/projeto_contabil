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

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "processos_renovacao")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProcessoJpaEntity {

    @Id
    private UUID id;
    
    @Column(name = "empresa_locataria_id")
    private String empresaLocatariaId;
    
    private UUID alvaraId;
    private String numeroProtocolo;
    private String status;
    private String observacoes;
    private LocalDateTime criadoEm;
}
