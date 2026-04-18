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
    private UUID departamentoId;
    private String observacaoNaoFechamento;
    private final String googleLeadId;
    private final LocalDateTime criadoEm;
    private int quantidadeMensagensNaoLidas;
    private boolean conversaPrivada;

    private Lead(UUID id, EmpresaLocatariaId empresaLocatariaId, String nomeContato, Email email,
                 Telefone telefone, Identificacao identificacao, String nomeEmpresa,
                 StatusLead status, OrigemLead origemLead, TipoServico tipoServico, UUID departamentoId,
                 String observacaoNaoFechamento, String googleLeadId, LocalDateTime criadoEm,
                 int quantidadeMensagensNaoLidas, boolean conversaPrivada) {
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
        this.departamentoId = departamentoId;
        this.observacaoNaoFechamento = observacaoNaoFechamento;
        this.googleLeadId = googleLeadId;
        this.criadoEm = criadoEm;
        this.quantidadeMensagensNaoLidas = quantidadeMensagensNaoLidas;
        this.conversaPrivada = conversaPrivada;
    }

    public static Lead criar(EmpresaLocatariaId id, String nome, Email email, Telefone telefone,
                              Identificacao identificacao, String nomeEmpresa,
                              OrigemLead origem, TipoServico tipoServico) {
        return new Lead(UUID.randomUUID(), id, nome, email, telefone, identificacao, nomeEmpresa,
                StatusLead.LEAD, origem, tipoServico, null, null, null, LocalDateTime.now(), 0, false);
    }

    public static Lead criarComGoogleId(EmpresaLocatariaId id, String nome, Email email, Telefone telefone,
                                         Identificacao identificacao, String nomeEmpresa,
                                         OrigemLead origem, TipoServico tipoServico, String googleId) {
        return new Lead(UUID.randomUUID(), id, nome, email, telefone, identificacao, nomeEmpresa,
                StatusLead.LEAD, origem, tipoServico, null, null, googleId, LocalDateTime.now(), 0, false);
    }

    public static Lead reconstituir(UUID id, EmpresaLocatariaId empresaId, String nome, Email email,
                                     Telefone tel, Identificacao ident, String emp,
                                     StatusLead status, OrigemLead origem, TipoServico tipoServico, UUID departamentoId,
                                     String observacaoNaoFechamento, String googleId, LocalDateTime criado,
                                     int quantidadeMensagensNaoLidas, boolean conversaPrivada) {
        return new Lead(id, empresaId, nome, email, tel, ident, emp, status, origem, tipoServico, departamentoId, 
                observacaoNaoFechamento, googleId, criado, quantidadeMensagensNaoLidas, conversaPrivada);
    }

    public void atualizarDados(String nome, Email email, Telefone telefone, String nomeEmpresa, 
                               Identificacao identificacao, OrigemLead origem, 
                               TipoServico tipoServico) {
        this.nomeContato = nome;
        this.email = email;
        this.telefone = telefone;
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
            // Limpar observação ao sair de NAO_FECHOU
            if (novoStatus != StatusLead.NAO_FECHOU) {
                this.observacaoNaoFechamento = null;
            }
        }
    }

    /**
     * Registra a observação do motivo de não fechamento e move o Lead para NAO_FECHOU.
     */
    public void registrarNaoFechamento(String observacao) {
        if (observacao == null || observacao.isBlank()) {
            throw new IllegalArgumentException("Observação de não fechamento é obrigatória.");
        }
        this.status = StatusLead.NAO_FECHOU;
        this.observacaoNaoFechamento = observacao;
    }

    public void incrementarMensagensNaoLidas() {
        this.quantidadeMensagensNaoLidas++;
    }

    public void resetarMensagensNaoLidas() {
        this.quantidadeMensagensNaoLidas = 0;
    }

    public void setConversaPrivada(boolean conversaPrivada) {
        this.conversaPrivada = conversaPrivada;
    }

    public void setDepartamentoId(UUID departamentoId) {
        this.departamentoId = departamentoId;
    }
}
