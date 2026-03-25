package com.projetocontabil.infra.persistence.entity;

import com.projetocontabil.core.domain.crm.model.enums.ConnectionProvider;
import com.projetocontabil.core.domain.crm.model.enums.ConnectionStatus;
import com.projetocontabil.infra.persistence.converter.EncryptionConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_external_connections")
@Audited
@Getter
@Setter
public class ExternalConnectionJpaEntity {

    @Id
    private UUID id;

    @Column(name = "empresa_locataria_id", nullable = false)
    private String empresaLocatariaId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConnectionProvider provider;

    @Convert(converter = EncryptionConverter.class)
    @Column(name = "access_token", columnDefinition = "TEXT")
    private String accessToken;

    @Convert(converter = EncryptionConverter.class)
    @Column(name = "refresh_token", columnDefinition = "TEXT")
    private String refreshToken;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "google_customer_id")
    private String googleCustomerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConnectionStatus status;

    @Column(name = "last_sync")
    private LocalDateTime lastSync;
}
