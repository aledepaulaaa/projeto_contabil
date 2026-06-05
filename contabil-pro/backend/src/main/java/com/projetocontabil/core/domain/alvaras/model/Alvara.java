package com.projetocontabil.core.domain.alvaras.model;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.domain.shared.AggregateRoot;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
public class Alvara extends AggregateRoot {
    private final EmpresaLocatariaId empresaLocatariaId;
    private final String numeroAlvara;
    private final String tipo;
    private final LocalDate dataEmissao;
    private final LocalDate dataVencimento;
    private final String status;
    private final LocalDateTime criadoEm;

    public Alvara(UUID id, EmpresaLocatariaId tid, String numero, String tipo, LocalDate emissao, LocalDate venc, String status, LocalDateTime criado) {
        super(id);
        this.empresaLocatariaId = tid;
        this.numeroAlvara = numero;
        this.tipo = tipo;
        this.dataEmissao = emissao;
        this.dataVencimento = venc;
        this.status = status;
        this.criadoEm = criado;
    }
}
