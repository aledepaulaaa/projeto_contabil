package com.projetocontabil.core.domain.crm.model;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Agregado que mantém o histórico completo de "Vida" de um Lead.
 * Persistido como um documento JSON (coluna JSONB no PostgreSQL) para auditoria eterna.
 * Cada evento é imutável uma vez adicionado.
 */
@Getter
public class HistoricoVidaLead {

    private final UUID id;
    private final UUID leadId;
    private final EmpresaLocatariaId empresaLocatariaId;
    private final List<EventoHistoricoLead> eventos;
    private final LocalDateTime criadoEm;

    private HistoricoVidaLead(UUID id, UUID leadId, EmpresaLocatariaId empresaLocatariaId,
                               List<EventoHistoricoLead> eventos, LocalDateTime criadoEm) {
        this.id = id;
        this.leadId = leadId;
        this.empresaLocatariaId = empresaLocatariaId;
        this.eventos = new ArrayList<>(eventos);
        this.criadoEm = criadoEm;
    }

    /**
     * Cria um novo histórico vazio para um Lead recém-cadastrado.
     */
    public static HistoricoVidaLead criar(UUID leadId, EmpresaLocatariaId empresaLocatariaId) {
        var historico = new HistoricoVidaLead(UUID.randomUUID(), leadId, empresaLocatariaId,
                new ArrayList<>(), LocalDateTime.now());
        historico.registrarEvento("LEAD_CRIADO", "Lead cadastrado no sistema",
                EventoHistoricoLead.MarcadorEvento.NEUTRO);
        return historico;
    }

    /**
     * Reconstitui a entidade a partir da persistência.
     */
    public static HistoricoVidaLead reconstituir(UUID id, UUID leadId, EmpresaLocatariaId empresaLocatariaId,
                                                   List<EventoHistoricoLead> eventos, LocalDateTime criadoEm) {
        return new HistoricoVidaLead(id, leadId, empresaLocatariaId, eventos, criadoEm);
    }

    /**
     * Registra um novo evento no histórico. Eventos são append-only.
     */
    public void registrarEvento(String tipo, String descricao, EventoHistoricoLead.MarcadorEvento marcador) {
        this.eventos.add(new EventoHistoricoLead(tipo, descricao, marcador));
    }

    /**
     * Retorna os eventos em ordem cronológica reversa (mais recente primeiro).
     */
    public List<EventoHistoricoLead> getEventosOrdenados() {
        var ordenados = new ArrayList<>(this.eventos);
        ordenados.sort((a, b) -> b.getOcorridoEm().compareTo(a.getOcorridoEm()));
        return Collections.unmodifiableList(ordenados);
    }
}
