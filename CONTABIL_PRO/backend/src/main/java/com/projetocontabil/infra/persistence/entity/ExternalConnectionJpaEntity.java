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

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getEmpresaLocatariaId() { return empresaLocatariaId; }
    public void setEmpresaLocatariaId(String empresaLocatariaId) { this.empresaLocatariaId = empresaLocatariaId; }

    public ConnectionProvider getProvider() { return provider; }
    public void setProvider(ConnectionProvider provider) { this.provider = provider; }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public String getGoogleCustomerId() { return googleCustomerId; }
    public void setGoogleCustomerId(String googleCustomerId) { this.googleCustomerId = googleCustomerId; }

    public ConnectionStatus getStatus() { return status; }
    public void setStatus(ConnectionStatus status) { this.status = status; }

    public LocalDateTime getLastSync() { return lastSync; }
    public void setLastSync(LocalDateTime lastSync) { this.lastSync = lastSync; }
}
