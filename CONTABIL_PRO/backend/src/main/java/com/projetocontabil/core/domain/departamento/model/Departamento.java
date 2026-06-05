package com.projetocontabil.core.domain.departamento.model;

import com.projetocontabil.core.domain.shared.AggregateRoot;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade de Domínio — Departamento.
 * Multi-tenant via empresaLocatariaId.
 * Departamentos padrão: Comercial, Fiscal, Contábil.
 */
public class Departamento extends AggregateRoot {
    private final String empresaLocatariaId;
    private final String nome;
    private final String descricao;
    private final LocalDateTime criadoEm;

    public String getEmpresaLocatariaId() { return empresaLocatariaId; }
    public String getNome() { return nome; }
    public String getDescricao() { return descricao; }
    public LocalDateTime getCriadoEm() { return criadoEm; }

    private Departamento(UUID id, String empresaLocatariaId, String nome, String descricao, LocalDateTime criadoEm) {
        super(id);
        this.empresaLocatariaId = empresaLocatariaId;
        this.nome = nome;
        this.descricao = descricao;
        this.criadoEm = criadoEm;
    }

    public static Departamento criar(String empresaLocatariaId, String nome, String descricao) {
        return new Departamento(UUID.randomUUID(), empresaLocatariaId, nome, descricao, LocalDateTime.now());
    }

    public static Departamento reconstituir(UUID id, String empresaLocatariaId, String nome, String descricao, LocalDateTime criadoEm) {
        return new Departamento(id, empresaLocatariaId, nome, descricao, criadoEm);
    }
}
