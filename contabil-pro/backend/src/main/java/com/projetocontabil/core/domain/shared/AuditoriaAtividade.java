package com.projetocontabil.core.domain.shared;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
public class AuditoriaAtividade {
    private final UUID id;
    private final EmpresaLocatariaId empresaId;
    private final String usuario;
    private final String tipo;
    private final String descricao;
    private final String metadata;
    private final LocalDateTime criadoEm;

    public AuditoriaAtividade(UUID id, EmpresaLocatariaId empresaId, String usuario, 
                            String tipo, String descricao, String metadata, LocalDateTime criadoEm) {
        this.id = id;
        this.empresaId = empresaId;
        this.usuario = usuario;
        this.tipo = tipo;
        this.descricao = descricao;
        this.metadata = metadata;
        this.criadoEm = criadoEm;
    }

    public static AuditoriaAtividade registrar(EmpresaLocatariaId empresaId, String usuario, 
                                             String tipo, String descricao, String metadata) {
        return new AuditoriaAtividade(UUID.randomUUID(), empresaId, usuario, tipo, 
                                    descricao, metadata, LocalDateTime.now());
    }
}
