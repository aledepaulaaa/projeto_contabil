package com.projetocontabil.core.domain.atendimento.model;

import com.projetocontabil.core.domain.shared.AggregateRoot;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Agregado de Atendimento (Ticket).
 * Gerencia a sessão de comunicação entre a contabilidade e um Lead/Contato.
 */
@Getter
public class Atendimento extends AggregateRoot {
    private final String empresaLocatariaId;
    private final UUID leadId;
    private UUID departamentoId;
    private UUID atendenteId;
    private StatusAtendimento status;
    private LocalDateTime criadoEm;
    private LocalDateTime puxadoEm;
    private LocalDateTime encerradoEm;
    private LocalDateTime atualizadoEm;
    private boolean transferido;
    private boolean restritoAdmin;

    private Atendimento(UUID id, String empresaLocatariaId, UUID leadId, UUID departamentoId, 
                         UUID atendenteId, StatusAtendimento status, LocalDateTime criadoEm, 
                         LocalDateTime puxadoEm, LocalDateTime encerradoEm, LocalDateTime atualizadoEm,
                         boolean transferido, boolean restritoAdmin) {
        super(id);
        this.empresaLocatariaId = empresaLocatariaId;
        this.leadId = leadId;
        this.departamentoId = departamentoId;
        this.atendenteId = atendenteId;
        this.status = status;
        this.criadoEm = criadoEm;
        this.puxadoEm = puxadoEm;
        this.encerradoEm = encerradoEm;
        this.atualizadoEm = atualizadoEm;
        this.transferido = transferido;
        this.restritoAdmin = restritoAdmin;
    }

    /**
     * Inicia um novo atendimento (Ticket) em fila de espera.
     */
    public static Atendimento criar(String empresaId, UUID leadId, UUID deptoId) {
        return new Atendimento(
            UUID.randomUUID(), 
            empresaId, 
            leadId, 
            deptoId, 
            null, 
            StatusAtendimento.AGUARDANDO, 
            LocalDateTime.now(), 
            null, 
            null, 
            LocalDateTime.now(),
            false,
            false // restritoAdmin default false
        );
    }

    public static Atendimento reconstituir(UUID id, String empresaId, UUID leadId, UUID deptoId, 
                                          UUID atendenteId, StatusAtendimento status, LocalDateTime criadoEm, 
                                          LocalDateTime puxadoEm, LocalDateTime encerradoEm, LocalDateTime atualizadoEm,
                                          boolean transferido, boolean restritoAdmin) {
        return new Atendimento(id, empresaId, leadId, deptoId, atendenteId, status, criadoEm, puxadoEm, encerradoEm, atualizadoEm, transferido, restritoAdmin);
    }

    public void setRestritoAdmin(boolean restritoAdmin) {
        this.restritoAdmin = restritoAdmin;
        this.atualizadoEm = LocalDateTime.now();
    }

    public void setTransferido(boolean transferido) {
        this.transferido = transferido;
        this.atualizadoEm = LocalDateTime.now();
    }

    public void toggleRestritoAdmin() {
        this.restritoAdmin = !this.restritoAdmin;
        this.atualizadoEm = LocalDateTime.now();
    }

    /**
     * Quando um consultor aceita atender o lead.
     */
    public void aceitar(UUID atendenteId) {
        if (this.status == StatusAtendimento.ENCERRADO) {
            throw new IllegalStateException("Não é possível aceitar um atendimento já encerrado.");
        }
        this.atendenteId = atendenteId;
        this.status = StatusAtendimento.EM_ATENDIMENTO;
        this.puxadoEm = LocalDateTime.now();
        this.atualizadoEm = LocalDateTime.now();
    }

    /**
     * Transfere o atendimento para outro departamento ou atendente.
     */
    public void transferir(UUID novoDeptoId, UUID novoAtendenteId) {
        this.departamentoId = novoDeptoId;
        this.atendenteId = novoAtendenteId;
        this.atualizadoEm = LocalDateTime.now();
        this.transferido = true;
        // Se transferiu sem atendente, volta para AGUARDANDO
        if (novoAtendenteId == null) {
            this.status = StatusAtendimento.AGUARDANDO;
        }
    }

    /**
     * Encerra a sessão de atendimento.
     */
    public void encerrar() {
        this.status = StatusAtendimento.ENCERRADO;
        this.encerradoEm = LocalDateTime.now();
        this.atualizadoEm = LocalDateTime.now();
    }

    /**
     * Reseta o tempo de espera para o momento atual (V3.1).
     */
    public void reiniciarEspera() {
        this.criadoEm = LocalDateTime.now();
        this.atualizadoEm = LocalDateTime.now();
    }

    /**
     * Quando um atendente "puxa" o lead da fila para iniciar o atendimento.
     * Transição: AGUARDANDO → EM_ATENDIMENTO
     */
    public void puxar(UUID atendenteId) {
        if (this.status == StatusAtendimento.ENCERRADO) {
            throw new IllegalStateException("Não é possível puxar um atendimento já encerrado.");
        }
        if (this.status == StatusAtendimento.EM_ATENDIMENTO) {
            throw new IllegalStateException("Este atendimento já está em andamento.");
        }
        this.atendenteId = atendenteId;
        this.status = StatusAtendimento.EM_ATENDIMENTO;
        this.puxadoEm = LocalDateTime.now();
        this.atualizadoEm = LocalDateTime.now();
    }
}
