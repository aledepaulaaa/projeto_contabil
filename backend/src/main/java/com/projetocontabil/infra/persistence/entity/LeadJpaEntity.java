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
    private String telefone;
    private String cnpj;
    private String nomeEmpresa;

    @Column(name = "departamento_id")
    private UUID departamentoId;

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

    @Column(name = "observacao_nao_fechamento")
    private String observacaoNaoFechamento;

    @Column(name = "quantidade_mensagens_nao_lidas")
    private Integer quantidadeMensagensNaoLidas = 0;

    @Column(name = "conversa_privada")
    private boolean conversaPrivada = false;
}
