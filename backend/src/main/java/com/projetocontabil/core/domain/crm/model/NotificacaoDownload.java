package com.projetocontabil.core.domain.crm.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class NotificacaoDownload {
    private final UUID id;
    private final String nomeArquivo;
    private final String formato;
    private final String urlDownload;
    private final LocalDateTime geradoEm;
    private boolean lido;

    public static NotificacaoDownload criar(String nome, String formato, String url) {
        return new NotificacaoDownload(UUID.randomUUID(), nome, formato, url, LocalDateTime.now(), false);
    }

    public void marcarComoLido() {
        this.lido = true;
    }
}
