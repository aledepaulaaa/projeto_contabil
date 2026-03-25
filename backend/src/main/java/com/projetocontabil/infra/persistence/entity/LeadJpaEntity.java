package com.projetocontabil.infra.persistence.entity;

import com.projetocontabil.core.domain.crm.model.OrigemLead;
import com.projetocontabil.core.domain.crm.model.StatusLead;
import com.projetocontabil.core.domain.crm.model.TipoServico;
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

    @Column(name = "empresa_locataria_id")
    private String empresaLocatariaId;

    private String nomeContato;
    private String email;
    private String cnpj;
    private String nomeEmpresa;

    @Enumerated(EnumType.STRING)
    private StatusLead status;

    @Enumerated(EnumType.STRING)
    @Column(name = "origem_lead")
    private OrigemLead origemLead;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_servico")
    private TipoServico tipoServico;

    private LocalDateTime criadoEm;

    @Column(name = "google_lead_id", unique = true)
    private String googleLeadId;
}
