package com.projetocontabil.core.ports.driven;

import com.projetocontabil.core.domain.shared.DomainEvent;
import java.util.Collection;

public interface EventPublisher {
    void publish(DomainEvent event);
    void publishAll(Collection<? extends DomainEvent> events);
}
