package com.projetocontabil.core.domain.crm.model;

import com.projetocontabil.core.domain.crm.vo.Email;
import com.projetocontabil.core.domain.crm.vo.Identificacao;
import com.projetocontabil.core.domain.crm.vo.Telefone;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.domain.shared.AggregateRoot;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
public class Lead extends AggregateRoot {
    private final EmpresaLocatariaId empresaLocatariaId;
    private String nomeContato;
    private Email email;
    private Telefone telefone;
    private Identificacao identificacao;
    private String nomeEmpresa;
    private StatusLead status;
    private OrigemLead origemLead;
    private TipoServico tipoServico;
    private final String googleLeadId;
    private final LocalDateTime criadoEm;

    private Lead(UUID id, EmpresaLocatariaId empresaLocatariaId, String nomeContato, Email email,
                 Telefone telefone, Identificacao identificacao, String nomeEmpresa,
                 StatusLead status, OrigemLead origemLead, TipoServico tipoServico,
                 String googleLeadId, LocalDateTime criadoEm) {
        super(id);
        this.empresaLocatariaId = empresaLocatariaId;
        this.nomeContato = nomeContato;
        this.email = email;
        this.telefone = telefone;
        this.identificacao = identificacao;
        this.nomeEmpresa = nomeEmpresa;
        this.status = status;
        this.origemLead = origemLead;
        this.tipoServico = tipoServico;
        this.googleLeadId = googleLeadId;
        this.criadoEm = criadoEm;
    }

    public static Lead criar(EmpresaLocatariaId id, String nome, Email email,
                              Identificacao identificacao, String nomeEmpresa,
                              OrigemLead origem, TipoServico tipoServico) {
        return new Lead(UUID.randomUUID(), id, nome, email, null, identificacao, nomeEmpresa,
                StatusLead.LEAD, origem, tipoServico, null, LocalDateTime.now());
    }

    public static Lead criarComGoogleId(EmpresaLocatariaId id, String nome, Email email,
                                         Identificacao identificacao, String nomeEmpresa,
                                         OrigemLead origem, TipoServico tipoServico, String googleId) {
        return new Lead(UUID.randomUUID(), id, nome, email, null, identificacao, nomeEmpresa,
                StatusLead.LEAD, origem, tipoServico, googleId, LocalDateTime.now());
    }

    public static Lead reconstituir(UUID id, EmpresaLocatariaId empresaId, String nome, Email email,
                                     Telefone tel, Identificacao ident, String emp,
                                     StatusLead status, OrigemLead origem, TipoServico tipoServico,
                                     String googleId, LocalDateTime criado) {
        return new Lead(id, empresaId, nome, email, tel, ident, emp, status, origem, tipoServico, googleId, criado);
    }

    public void atualizarDados(String nome, Email email, String nomeEmpresa, 
                               Identificacao identificacao, OrigemLead origem, 
                               TipoServico tipoServico) {
        this.nomeContato = nome;
        this.email = email;
        this.nomeEmpresa = nomeEmpresa;
        this.identificacao = identificacao;
        this.origemLead = origem;
        this.tipoServico = tipoServico;
    }

    public void qualificar() {
        if (this.status == StatusLead.LEAD) {
            this.status = StatusLead.QUALIFICACAO;
        }
    }

    public void converter() {
        this.status = StatusLead.FECHAMENTO;
    }

    public void mudarStatus(StatusLead novoStatus) {
        if (novoStatus != null) {
            this.status = novoStatus;
        }
    }
}
