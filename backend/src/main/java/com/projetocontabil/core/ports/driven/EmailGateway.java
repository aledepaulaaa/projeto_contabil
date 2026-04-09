package com.projetocontabil.core.ports.driven;

/**
 * Port de saída para envio de e-mails (DIP).
 * Implementações: MailtrapEmailGateway, MockEmailGateway (testes).
 */
public interface EmailGateway {
    
    /**
     * Envia e-mail de convite para um novo usuário.
     */
    void enviarConvite(String emailDestino, String nomeConvidado, String senhaGerada, String nomeEmpresa);

    /**
     * Envia notificação genérica por e-mail.
     */
    void enviarNotificacao(String emailDestino, String assunto, String corpo);
}
