package com.projetocontabil.infra.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "mensagens_chat")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MensagemChatJpaEntity {

    @Id
    private UUID id;

    @Column(name = "lead_id")
    private UUID leadId;

    @Column(name = "empresa_locataria_id")
    private String empresaLocatariaId;

    @Column(name = "atendimento_id")
    private UUID atendimentoId;

    @Column(columnDefinition = "TEXT")
    private String conteudo;

    private String remetente; // LEAD ou CONSULTOR

    @Column(name = "tipo")
    private String tipo = "EXTERNA"; // EXTERNA ou INTERNA

    @Column(name = "usuario_id")
    private UUID usuarioId;

    @Column(name = "visivel")
    private Boolean visivel = true;

    @Column(name = "restrito_admin")
    private Boolean restritoAdmin = false;
    
    private LocalDateTime enviadoEm;
}
