package com.projetocontabil.core.domain.serpro.model;

import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Entidade de domínio pura (Aggregate Root) que representa os dados decifrados de rendimentos
 * do contribuinte obtidos através do Compartilha Receita (SERPRO).
 */
@Getter
public class RendaContribuinte {

    private final String titular;
    private final String destinatario;
    private final LocalDateTime dataHoraRegistro;
    private final String token;
    private final String avisoLegal;
    private final List<DadoRenda> dados;

    private RendaContribuinte(String titular, String destinatario, LocalDateTime dataHoraRegistro,
                              String token, String avisoLegal, List<DadoRenda> dados) {
        this.titular = titular;
        this.destinatario = destinatario;
        this.dataHoraRegistro = dataHoraRegistro;
        this.token = token;
        this.avisoLegal = avisoLegal;
        this.dados = dados;
    }

    /**
     * Reconstitui a entidade de RendaContribuinte a partir de dados decodificados da infraestrutura.
     */
    public static RendaContribuinte reconstituir(String titular, String destinatario, LocalDateTime dataHoraRegistro,
                                                 String token, String avisoLegal, List<DadoRenda> dados) {
        if (titular == null || titular.isBlank()) {
            throw new IllegalArgumentException("CPF do titular é obrigatório.");
        }
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Token de consentimento é obrigatório.");
        }
        return new RendaContribuinte(titular, destinatario, dataHoraRegistro, token, avisoLegal, dados);
    }
}
