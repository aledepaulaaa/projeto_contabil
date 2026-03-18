package com.projetocontabil.infra.persistence.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "documentos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DocumentoJpaEntity {

    @Id
    private UUID id;
    private String empresaLocatariaId;
    private String nomeOriginal;
    private String caminhoStorage;
    private String tipo;
    private long tamanho;
    private LocalDateTime criadoEm;
}
