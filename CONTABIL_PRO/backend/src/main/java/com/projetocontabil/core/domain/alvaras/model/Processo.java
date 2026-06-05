package com.projetocontabil.core.domain.alvaras.model;

import com.projetocontabil.core.domain.shared.AggregateRoot;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
public class Processo extends AggregateRoot {
    private final UUID alvaraId;
    private final String numeroProtocolo;
    private final String status;
    private final String observacoes;
    private final LocalDateTime criadoEm;

    public Processo(UUID id, UUID alvaraId, String numero, String status, String obs, LocalDateTime criado) {
        super(id);
        this.alvaraId = alvaraId;
        this.numeroProtocolo = numero;
        this.status = status;
        this.observacoes = obs;
        this.criadoEm = criado;
    }
}
