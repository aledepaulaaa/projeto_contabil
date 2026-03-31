package com.projetocontabil.infra.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "auditoria_atividades")
@Getter
@Setter
public class AuditoriaJpaEntity {
    @Id
    private UUID id;
    
    @Column(name = "empresa_locataria_id")
    private String empresaLocatariaId;
    
    private String usuario;
    private String tipo;
    private String descricao;
    private String metadata;
    private LocalDateTime criadoEm;
}
