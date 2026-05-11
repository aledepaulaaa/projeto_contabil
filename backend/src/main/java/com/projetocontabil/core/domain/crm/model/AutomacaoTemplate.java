package com.projetocontabil.core.domain.crm.model;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
public class AutomacaoTemplate {

    private final UUID id;
    private final EmpresaLocatariaId empresaLocatariaId;
    private final StatusLead gatilho;
    private String texto;
    private LocalDateTime atualizadoEm;

    private AutomacaoTemplate(UUID id, EmpresaLocatariaId empresaLocatariaId, StatusLead gatilho, String texto, LocalDateTime atualizadoEm) {
        this.id = id;
        this.empresaLocatariaId = empresaLocatariaId;
        this.gatilho = gatilho;
        this.texto = texto;
        this.atualizadoEm = atualizadoEm;
    }

    public static AutomacaoTemplate criar(EmpresaLocatariaId empresaId, StatusLead gatilho, String texto) {
        return new AutomacaoTemplate(UUID.randomUUID(), empresaId, gatilho, texto, LocalDateTime.now());
    }

    public static AutomacaoTemplate reconstruir(UUID id, EmpresaLocatariaId empresaId, StatusLead gatilho, String texto, LocalDateTime atualizadoEm) {
        return new AutomacaoTemplate(id, empresaId, gatilho, texto, atualizadoEm);
    }

    public void atualizarTexto(String novoTexto) {
        if (novoTexto == null || novoTexto.trim().isEmpty()) {
            throw new IllegalArgumentException("O texto do template não pode ser vazio.");
        }
        this.texto = novoTexto;
        this.atualizadoEm = LocalDateTime.now();
    }
}
