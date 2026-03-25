package com.projetocontabil.interfaces.rest.dto;

/**
 * DTO padrão para respostas de erro.
 * Erros 500 incluem um UUID de protocolo para rastreamento interno sem expor stack traces.
 */
public record ErroResponseDTO(
    String mensagem,
    String tipo,
    String protocolo
) {}
