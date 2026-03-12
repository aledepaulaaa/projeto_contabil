package com.projetocontabil.core.domain.shared;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Classe base para Aggregate Roots do domínio.
 * Gerencia a lista interna de Domain Events que serão publicados
 * pela camada de infraestrutura após a persistência.
 *
 * ⚠️ REGRA: Esta classe é 100% Java puro. Nenhum framework.
 */
public abstract class AggregateRoot {

    private final List<DomainEvent> domainEvents = new ArrayList<>();

    /**
     * Registra um evento de domínio para publicação futura.
     */
    protected void registerEvent(DomainEvent event) {
        if (event == null) {
            throw new IllegalArgumentException("Domain event cannot be null");
        }
        this.domainEvents.add(event);
    }

    /**
     * Retorna cópia imutável dos eventos pendentes.
     */
    public List<DomainEvent> getDomainEvents() {
        return Collections.unmodifiableList(domainEvents);
    }

    /**
     * Limpa os eventos após publicação (chamado pela infra).
     */
    public void clearDomainEvents() {
        this.domainEvents.clear();
    }
}
