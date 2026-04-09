package com.projetocontabil.core.domain.crm.model;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade de domínio que representa o Contrato de Prestação de Serviços.
 * Implementa a máquina de estados: GERANDO → AGUARDANDO_ASSINATURA → ATIVO → CANCELADO.
 * Vinculado a um Lead e isolado por EmpresaLocatariaId (Multi-tenant).
 */
@Getter
public class Contrato {

    private final UUID id;
    private final UUID leadId;
    private final EmpresaLocatariaId empresaLocatariaId;
    private StatusContrato status;
    private String motivoCancelamento;
    private String urlDocumentoZapSign;
    private String nomeContato;
    private String emailContato;
    private final LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

    private Contrato(UUID id, UUID leadId, EmpresaLocatariaId empresaLocatariaId,
                     StatusContrato status, String motivoCancelamento,
                     String urlDocumentoZapSign, String nomeContato, String emailContato,
                     LocalDateTime criadoEm, LocalDateTime atualizadoEm) {
        this.id = id;
        this.leadId = leadId;
        this.empresaLocatariaId = empresaLocatariaId;
        this.status = status;
        this.motivoCancelamento = motivoCancelamento;
        this.urlDocumentoZapSign = urlDocumentoZapSign;
        this.nomeContato = nomeContato;
        this.emailContato = emailContato;
        this.criadoEm = criadoEm;
        this.atualizadoEm = atualizadoEm;
    }

    /**
     * Cria um novo contrato no estado AGUARDANDO_ASSINATURA (fluxo legado).
     */
    public static Contrato criar(UUID leadId, EmpresaLocatariaId empresaLocatariaId) {
        return new Contrato(
                UUID.randomUUID(), leadId, empresaLocatariaId,
                StatusContrato.AGUARDANDO_ASSINATURA, null, null, null, null,
                LocalDateTime.now(), LocalDateTime.now()
        );
    }

    /**
     * Cria um novo contrato no estado GERANDO com dados do lead para geração assíncrona via ZapSign.
     */
    public static Contrato criarParaGeracao(UUID leadId, EmpresaLocatariaId empresaLocatariaId,
                                             String nomeContato, String emailContato) {
        return new Contrato(
                UUID.randomUUID(), leadId, empresaLocatariaId,
                StatusContrato.GERANDO, null, null, nomeContato, emailContato,
                LocalDateTime.now(), LocalDateTime.now()
        );
    }

    /**
     * Reconstitui a entidade a partir da persistência.
     */
    public static Contrato reconstituir(UUID id, UUID leadId, EmpresaLocatariaId empresaLocatariaId,
                                         StatusContrato status, String motivoCancelamento,
                                         String urlDocumentoZapSign, String nomeContato, String emailContato,
                                         LocalDateTime criadoEm, LocalDateTime atualizadoEm) {
        return new Contrato(id, leadId, empresaLocatariaId, status, motivoCancelamento,
                urlDocumentoZapSign, nomeContato, emailContato, criadoEm, atualizadoEm);
    }

    /**
     * Transição: GERANDO → AGUARDANDO_ASSINATURA
     * Disparada após o documento ser criado com sucesso na ZapSign.
     */
    public void vincularDocumentoZapSign(String url) {
        if (this.status != StatusContrato.GERANDO) {
            throw new IllegalStateException("Documento só pode ser vinculado a contratos no estado GERANDO. Estado atual: " + this.status);
        }
        this.urlDocumentoZapSign = url;
        this.status = StatusContrato.AGUARDANDO_ASSINATURA;
        this.atualizadoEm = LocalDateTime.now();
    }

    /**
     * Transição: AGUARDANDO_ASSINATURA → ATIVO
     * Disparada após confirmação de assinatura via ZapSign.
     */
    public void ativar() {
        if (this.status != StatusContrato.AGUARDANDO_ASSINATURA) {
            throw new IllegalStateException("Contrato só pode ser ativado a partir do estado AGUARDANDO_ASSINATURA. Estado atual: " + this.status);
        }
        this.status = StatusContrato.ATIVO;
        this.atualizadoEm = LocalDateTime.now();
    }

    /**
     * Transição: qualquer estado → CANCELADO
     * Requer motivo obrigatório.
     */
    public void cancelar(String motivo) {
        if (motivo == null || motivo.isBlank()) {
            throw new IllegalArgumentException("Motivo do cancelamento é obrigatório.");
        }
        this.status = StatusContrato.CANCELADO;
        this.motivoCancelamento = motivo;
        this.atualizadoEm = LocalDateTime.now();
    }

    /**
     * Transição: GERANDO → ERRO
     * Disparada quando a geração do contrato via ZapSign falha.
     */
    public void marcarErro() {
        if (this.status != StatusContrato.GERANDO) {
            throw new IllegalStateException("Só pode marcar erro em contratos no estado GERANDO. Estado atual: " + this.status);
        }
        this.status = StatusContrato.ERRO;
        this.atualizadoEm = LocalDateTime.now();
    }

    /**
     * Transição: ERRO → GERANDO
     * Permite que o usuário tente gerar o contrato novamente.
     */
    public void retentarGeracao() {
        if (this.status == StatusContrato.ATIVO) {
            throw new IllegalStateException("Não é possível retentar a geração de um contrato que já está ATIVO.");
        }
        this.status = StatusContrato.GERANDO;
        this.urlDocumentoZapSign = null;
        this.motivoCancelamento = null;
        this.atualizadoEm = LocalDateTime.now();
    }

    /**
     * Transição: ATIVO | CANCELADO | ERRO → ARQUIVADO
     * Permite organizar contratos que não requerem mais ação imediata.
     */
    public void arquivar() {
        if (this.status == StatusContrato.GERANDO || this.status == StatusContrato.AGUARDANDO_ASSINATURA) {
            throw new IllegalStateException("Não é possível arquivar um contrato que ainda está em processo de geração ou assinatura.");
        }
        this.status = StatusContrato.ARQUIVADO;
        this.atualizadoEm = LocalDateTime.now();
    }
}
