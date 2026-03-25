package com.projetocontabil.core.domain.crm.model;

/**
 * Tipo de serviço solicitado pelo Lead.
 * Determina o fluxo de qualificação e os gatilhos subsequentes:
 * - ABERTURA → dispara módulo de Processos/Alvarás
 * - TRANSFERENCIA → dispara Migração de Dados e Certificado Digital
 */
public enum TipoServico {
    ABERTURA,
    TRANSFERENCIA
}
