package com.projetocontabil.core.domain.shared;

/**
 * Interface marcadora para Domain Events.
 * Todos os eventos de domínio (ex: OnboardingFinalizadoEvent, AlvaraVencidoEvent)
 * devem implementar esta interface.
 *
 * Domain Events são objetos imutáveis que representam algo que aconteceu no domínio.
 * Devem ser Java Records para garantir imutabilidade.
 */
public interface DomainEvent {

    /**
     * Identificador do evento para rastreabilidade.
     */
    java.time.Instant occurredOn();
}
