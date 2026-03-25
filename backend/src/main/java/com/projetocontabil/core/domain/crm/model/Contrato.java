package com.projetocontabil.core.domain.crm.model;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade de domínio que representa o Contrato de Prestação de Serviços.
 * Implementa a máquina de estados: AGUARDANDO_ASSINATURA → ATIVO → CANCELADO.
 * Vinculado a um Lead e isolado por EmpresaLocatariaId (Multi-tenant).
 */
@Getter
public class Contrato {

    private final UUID id;
    private final UUID leadId;
    private final EmpresaLocatariaId empresaLocatariaId;
    private StatusContrato status;
    private String motivoCancelamento;
    private final LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

    private Contrato(UUID id, UUID leadId, EmpresaLocatariaId empresaLocatariaId,
                     StatusContrato status, String motivoCancelamento,
                     LocalDateTime criadoEm, LocalDateTime atualizadoEm) {
        this.id = id;
        this.leadId = leadId;
        this.empresaLocatariaId = empresaLocatariaId;
        this.status = status;
        this.motivoCancelamento = motivoCancelamento;
        this.criadoEm = criadoEm;
        this.atualizadoEm = atualizadoEm;
    }

    /**
     * Cria um novo contrato no estado AGUARDANDO_ASSINATURA.
     */
    public static Contrato criar(UUID leadId, EmpresaLocatariaId empresaLocatariaId) {
        return new Contrato(
                UUID.randomUUID(), leadId, empresaLocatariaId,
                StatusContrato.AGUARDANDO_ASSINATURA, null,
                LocalDateTime.now(), LocalDateTime.now()
        );
    }

    /**
     * Reconstitui a entidade a partir da persistência.
     */
    public static Contrato reconstituir(UUID id, UUID leadId, EmpresaLocatariaId empresaLocatariaId,
                                         StatusContrato status, String motivoCancelamento,
                                         LocalDateTime criadoEm, LocalDateTime atualizadoEm) {
        return new Contrato(id, leadId, empresaLocatariaId, status, motivoCancelamento, criadoEm, atualizadoEm);
    }

    /**
     * Transição: AGUARDANDO_ASSINATURA → ATIVO
     * Disparada após confirmação de assinatura via ZapSign.
     */
    public void ativar() {
        if (this.status != StatusContrato.AGUARDANDO_ASSINATURA) {
            throw new IllegalStateException("Contrato só pode ser ativado a partir do estado AGUARDANDO_ASSINATURA. Estado atual: " + this.status);
        }
        this.status = StatusContrato.ATIVO;
        this.atualizadoEm = LocalDateTime.now();
    }

    /**
     * Transição: qualquer estado → CANCELADO
     * Requer motivo obrigatório. Permite retomada posterior sem perda de histórico.
     */
    public void cancelar(String motivo) {
        if (motivo == null || motivo.isBlank()) {
            throw new IllegalArgumentException("Motivo do cancelamento é obrigatório.");
        }
        this.status = StatusContrato.CANCELADO;
        this.motivoCancelamento = motivo;
        this.atualizadoEm = LocalDateTime.now();
    }
}
