package com.projetocontabil.core.domain.rotinas.model;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.domain.shared.AggregateRoot;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
public class Obrigacao extends AggregateRoot {
    public enum StatusObrigacao { 
        A_FAZER, 
        AGUARDANDO_ENVIO, 
        ENTREGUE, 
        ATRASADA 
    }

    private final EmpresaLocatariaId empresaLocatariaId;
    private final String descricao;
    private final TipoObrigacao tipo;
    private final int mesCompetencia;
    private final int anoCompetencia;
    private final LocalDateTime dataVencimento;
    private StatusObrigacao status;
    private final LocalDateTime criadoEm;
    
    // Novos campos para conformidade e SaaS
    private String responsavel;
    private LocalDateTime dataHomologacao;
    private String caminhoPdfHomologado;

    private Obrigacao(UUID id, EmpresaLocatariaId tid, String desc, TipoObrigacao tipo, int mes, int ano, LocalDateTime venc, StatusObrigacao status, LocalDateTime criado) {
        super(id);
        this.empresaLocatariaId = tid;
        this.descricao = desc;
        this.tipo = tipo;
        this.mesCompetencia = mes;
        this.anoCompetencia = ano;
        this.dataVencimento = venc;
        this.status = status;
        this.criadoEm = criado;
    }

    public static Obrigacao reconstituir(UUID id, EmpresaLocatariaId tid, String desc, TipoObrigacao tipo, int mes, int ano, LocalDateTime venc, StatusObrigacao status, LocalDateTime criado) {
        return new Obrigacao(id, tid, desc, tipo, mes, ano, venc, status, criado);
    }
    
    public void homologar(String responsavel, String caminhoPdf) {
        this.responsavel = responsavel;
        this.caminhoPdfHomologado = caminhoPdf;
        this.dataHomologacao = LocalDateTime.now();
        this.status = StatusObrigacao.ENTREGUE;
    }

    public void marcarComoAguardandoEnvio() {
        this.status = StatusObrigacao.AGUARDANDO_ENVIO;
    }
}
