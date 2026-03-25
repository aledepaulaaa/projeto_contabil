package com.projetocontabil.core.domain.crm.model;

import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Registro individual de um evento no histórico de vida do Lead.
 * Cada evento possui um tipo, descrição, data e cor de marcador visual.
 *
 * Marcadores:
 * - SUCESSO (Verde): Conversão, contrato assinado, pagamento confirmado
 * - ATENCAO (Amarelo): Gargalo, prazo próximo, aguardando ação
 * - NEUTRO (Cinza): Progresso incremental, atualização de status
 */
@Getter
public class EventoHistoricoLead {

    private final UUID id;
    private final String tipo;
    private final String descricao;
    private final MarcadorEvento marcador;
    private final LocalDateTime ocorridoEm;

    public EventoHistoricoLead(String tipo, String descricao, MarcadorEvento marcador) {
        this.id = UUID.randomUUID();
        this.tipo = tipo;
        this.descricao = descricao;
        this.marcador = marcador;
        this.ocorridoEm = LocalDateTime.now();
    }

    public EventoHistoricoLead(UUID id, String tipo, String descricao, MarcadorEvento marcador, LocalDateTime ocorridoEm) {
        this.id = id;
        this.tipo = tipo;
        this.descricao = descricao;
        this.marcador = marcador;
        this.ocorridoEm = ocorridoEm;
    }

    public enum MarcadorEvento {
        SUCESSO,
        ATENCAO,
        NEUTRO
    }
}
