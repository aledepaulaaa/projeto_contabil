package com.projetocontabil.infra.persistence.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.projetocontabil.core.domain.crm.model.EventoHistoricoLead;
import com.projetocontabil.core.domain.crm.model.HistoricoVidaLead;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.HistoricoVidaLeadRepository;
import com.projetocontabil.infra.persistence.entity.HistoricoVidaLeadJpaEntity;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Adapter que serializa/deserializa os eventos do histórico como JSON (JSONB no PostgreSQL).
 * Usa Jackson para converter entre List<EventoHistoricoLead> e String.
 */
@Component
public class HistoricoVidaLeadRepositoryAdapter implements HistoricoVidaLeadRepository {

    private final HistoricoVidaLeadJpaRepository jpaRepository;
    private final ObjectMapper objectMapper;

    public HistoricoVidaLeadRepositoryAdapter(HistoricoVidaLeadJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    @Override
    public HistoricoVidaLead save(HistoricoVidaLead historico) {
        var entity = toEntity(historico);
        var salva = jpaRepository.save(entity);
        return toDomain(salva);
    }

    @Override
    public Optional<HistoricoVidaLead> findByLeadId(UUID leadId) {
        return jpaRepository.findByLeadId(leadId).map(this::toDomain);
    }

    private HistoricoVidaLead toDomain(HistoricoVidaLeadJpaEntity entity) {
        List<EventoHistoricoLead> eventos = deserializarEventos(entity.getEventos());
        return HistoricoVidaLead.reconstituir(
                entity.getId(),
                entity.getLeadId(),
                EmpresaLocatariaId.of(entity.getEmpresaLocatariaId()),
                eventos,
                entity.getCriadoEm()
        );
    }

    private HistoricoVidaLeadJpaEntity toEntity(HistoricoVidaLead historico) {
        return new HistoricoVidaLeadJpaEntity(
                historico.getId(),
                historico.getLeadId(),
                historico.getEmpresaLocatariaId().value(),
                serializarEventos(historico.getEventos()),
                historico.getCriadoEm()
        );
    }

    private String serializarEventos(List<EventoHistoricoLead> eventos) {
        try {
            return objectMapper.writeValueAsString(eventos);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Falha ao serializar eventos do histórico", e);
        }
    }

    private List<EventoHistoricoLead> deserializarEventos(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Falha ao deserializar eventos do histórico", e);
        }
    }
}
