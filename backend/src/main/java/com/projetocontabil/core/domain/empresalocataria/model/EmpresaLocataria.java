package com.projetocontabil.core.domain.empresalocataria.model;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.domain.rotinas.model.RegimeTributario;
import com.projetocontabil.core.domain.shared.AggregateRoot;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade de Domínio — Empresa Locatária (Tenant).
 */
@Getter
public class EmpresaLocataria extends AggregateRoot {
    private final EmpresaLocatariaId empresaId;
    private final String nome;
    private final String cnpj;
    private final RegimeTributario regimeTributario;
    private final LocalDateTime criadoEm;
    private final LocalDateTime dataFimTrial;

    private EmpresaLocataria(UUID id, EmpresaLocatariaId empresaId, String nome, String cnpj, RegimeTributario regime, LocalDateTime criadoEm, LocalDateTime dataFimTrial) {
        super(id);
        this.empresaId = empresaId;
        this.nome = nome;
        this.cnpj = cnpj;
        this.regimeTributario = regime;
        this.criadoEm = criadoEm;
        this.dataFimTrial = dataFimTrial;
    }

    public static EmpresaLocataria criar(EmpresaLocatariaId empresaId, String nome, String cnpj, RegimeTributario regime) {
        LocalDateTime agora = LocalDateTime.now();
        return new EmpresaLocataria(UUID.randomUUID(), empresaId, nome, cnpj, regime, agora, agora.plusDays(7));
    }

    public static EmpresaLocataria reconstituir(UUID id, EmpresaLocatariaId empresaId, String nome, String cnpj, RegimeTributario regime, LocalDateTime criadoEm, LocalDateTime dataFimTrial) {
        return new EmpresaLocataria(id, empresaId, nome, cnpj, regime, criadoEm, dataFimTrial);
    }

    public boolean isTrialVencido() {
        return LocalDateTime.now().isAfter(this.dataFimTrial);
    }
}
