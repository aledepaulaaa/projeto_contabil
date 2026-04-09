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

    @Column(columnDefinition = "TEXT")
    private String conteudo;

    private String remetente; // LEAD ou CONSULTOR
    
    private LocalDateTime enviadoEm;
}
