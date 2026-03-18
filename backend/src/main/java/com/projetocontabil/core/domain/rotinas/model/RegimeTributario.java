package com.projetocontabil.core.domain.rotinas.model;

/**
 * Define os regimes tributários suportados pelo motor de rotinas.
 */
public enum RegimeTributario {
    MEI("Microempreendedor Individual"),
    SIMPLES_NACIONAL("Simples Nacional"),
    LUCRO_PRESUMIDO("Lucro Presumido"),
    LUCRO_REAL("Lucro Real"),
    ONG("Organização Não Governamental"),
    PF("Pessoa Física");

    private final String descricao;

    RegimeTributario(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
