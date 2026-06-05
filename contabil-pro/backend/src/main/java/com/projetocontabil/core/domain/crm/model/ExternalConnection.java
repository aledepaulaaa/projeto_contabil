package com.projetocontabil.core.domain.crm.model;

import com.projetocontabil.core.domain.crm.model.enums.ConnectionProvider;
import com.projetocontabil.core.domain.crm.model.enums.ConnectionStatus;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
public class ExternalConnection {
    private final UUID id;
    private final String empresaLocatariaId;
    private final ConnectionProvider provider;
    private final String accessToken;
    private final String refreshToken;
    private final LocalDateTime expiresAt;
    private final String googleCustomerId;
    private final ConnectionStatus status;
    private final LocalDateTime lastSync;

    public ExternalConnection(UUID id, String empresaLocatariaId, ConnectionProvider provider,
                              String accessToken, String refreshToken, LocalDateTime expiresAt,
                              String googleCustomerId, ConnectionStatus status, LocalDateTime lastSync) {
        if (empresaLocatariaId == null || empresaLocatariaId.isBlank()) {
            throw new IllegalArgumentException("empresa_locataria_id é obrigatório para ExternalConnection");
        }
        this.id = id;
        this.empresaLocatariaId = empresaLocatariaId;
        this.provider = provider;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresAt = expiresAt;
        this.googleCustomerId = googleCustomerId;
        this.status = status;
        this.lastSync = lastSync;
    }
}
