package com.projetocontabil.infra.persistence.entity;

import com.projetocontabil.core.domain.crm.model.StatusLead;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "leads")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LeadJpaEntity {

    @Id
    private UUID id;

    @Column(name = "empresa_locataria_id") // Nome da coluna no banco
    private String empresaLocatariaId;

    private String nomeContato;
    private String email;
    private String cnpj;
    private String nomeEmpresa;

    @Enumerated(EnumType.STRING)
    private StatusLead status;

    private LocalDateTime criadoEm;
}
