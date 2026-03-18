package com.projetocontabil.infra.persistence.entity;

import com.projetocontabil.core.domain.rotinas.model.RegimeTributario;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.time.LocalDateTime;

@Entity
@Table(name = "empresas_locatarias")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmpresaLocatariaJpaEntity {

    @Id
    private String id; // Aggregate ID
    
    @Column(unique = true)
    private String empresaId; // EmpresaLocatariaId.value()
    
    private String nome;
    private String cnpj;
    
    @Enumerated(EnumType.STRING)
    private RegimeTributario regime;
    
    private LocalDateTime criadoEm;
    private LocalDateTime dataFimTrial;
}
