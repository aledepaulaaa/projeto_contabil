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
    private final String nomeContato;
    private final Email email;
    private final Telefone telefone;
    private final Identificacao identificacao;
    private final String nomeEmpresa;
    private StatusLead status;
    private final OrigemLead origemLead;
    private final TipoServico tipoServico;
    private final LocalDateTime criadoEm;

    private Lead(UUID id, EmpresaLocatariaId empresaLocatariaId, String nomeContato, Email email,
                 Telefone telefone, Identificacao identificacao, String nomeEmpresa,
                 StatusLead status, OrigemLead origemLead, TipoServico tipoServico,
                 LocalDateTime criadoEm) {
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
        this.criadoEm = criadoEm;
    }

    public static Lead criar(EmpresaLocatariaId id, String nome, Email email,
                              Identificacao identificacao, String nomeEmpresa,
                              OrigemLead origem, TipoServico tipoServico) {
        return new Lead(UUID.randomUUID(), id, nome, email, null, identificacao, nomeEmpresa,
                StatusLead.NOVO, origem, tipoServico, LocalDateTime.now());
    }

    public static Lead reconstituir(UUID id, EmpresaLocatariaId tid, String nome, Email email,
                                     Telefone tel, Identificacao ident, String emp,
                                     StatusLead status, OrigemLead origem, TipoServico tipoServico,
                                     LocalDateTime criado) {
        return new Lead(id, tid, nome, email, tel, ident, emp, status, origem, tipoServico, criado);
    }

    public void qualificar() {
        if (this.status == StatusLead.NOVO) {
            this.status = StatusLead.QUALIFICADO;
        }
    }

    public void converter() {
        this.status = StatusLead.CONVERTIDO;
    }
}
