package com.projetocontabil.core.domain.crm.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class NotificacaoDownload {
    public enum TipoNotificacao { DOWNLOAD, CONTRATO }

    private final UUID id;
    private final String nomeArquivo;
    private final String formato;
    private final String urlDownload;
    private final LocalDateTime geradoEm;
    private boolean lido;
    private final TipoNotificacao tipo;

    public static NotificacaoDownload criar(String nome, String formato, String url) {
        return new NotificacaoDownload(UUID.randomUUID(), nome, formato, url, LocalDateTime.now(), false, TipoNotificacao.DOWNLOAD);
    }

    public static NotificacaoDownload criarContrato(String nomeLead, String urlAssinatura) {
        return new NotificacaoDownload(UUID.randomUUID(), nomeLead, "CONTRATO", urlAssinatura, LocalDateTime.now(), false, TipoNotificacao.CONTRATO);
    }

    public void marcarComoLido() {
        this.lido = true;
    }
}
