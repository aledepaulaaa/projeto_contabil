package com.projetocontabil.infra.integrations.email;

import com.projetocontabil.core.ports.driven.EmailGateway;
import io.mailtrap.client.MailtrapClient;
import io.mailtrap.config.MailtrapConfig;
import io.mailtrap.factory.MailtrapClientFactory;
import io.mailtrap.model.request.emails.Address;
import io.mailtrap.model.request.emails.MailtrapMail;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Implementação do EmailGateway usando Mailtrap Java SDK.
 * Envia e-mails reais via API transacional: https://send.api.mailtrap.io/api/send
 */
@Component
public class MailtrapEmailGateway implements EmailGateway {

    private static final Logger log = LoggerFactory.getLogger(MailtrapEmailGateway.class);
    private final MailtrapClient client;
    private final String remetenteEmail;

    public MailtrapEmailGateway(
            @Value("${mailtrap.api-token}") String apiToken,
            @Value("${mailtrap.sender-email:noreply@contabilpro.com.br}") String remetenteEmail,
            @Value("${mailtrap.sandbox:false}") boolean sandbox,
            @Value("${mailtrap.inbox-id:0}") long inboxId
    ) {
        this.remetenteEmail = remetenteEmail;

        var configBuilder = new MailtrapConfig.Builder().token(apiToken);
        if (sandbox) {
            configBuilder.sandbox(true).inboxId(inboxId);
        }

        this.client = MailtrapClientFactory.createMailtrapClient(configBuilder.build());
        log.info("[MailtrapEmailGateway] ✅ Inicializado — sandbox={}, remetente={}", sandbox, remetenteEmail);
    }

    @Override
    public void enviarConvite(String emailDestino, String nomeConvidado, String senhaGerada, String nomeEmpresa) {
        String assunto = "🎉 Convite — Você foi adicionado ao " + nomeEmpresa;
        String corpo = montarCorpoConvite(nomeConvidado, emailDestino, senhaGerada, nomeEmpresa);

        enviarEmail(emailDestino, assunto, corpo);
    }

    @Override
    public void enviarNotificacao(String emailDestino, String assunto, String corpo) {
        enviarEmail(emailDestino, assunto, corpo);
    }

    private void enviarEmail(String emailDestino, String assunto, String corpo) {
        try {
            var mail = MailtrapMail.builder()
                    .from(new Address(remetenteEmail, "ContábilPro"))
                    .to(List.of(new Address(emailDestino)))
                    .subject(assunto)
                    .html(corpo)
                    .build();

            client.send(mail);
            log.info("[MailtrapEmailGateway] ✅ E-mail enviado para {}: {}", emailDestino, assunto);
        } catch (Exception e) {
            log.error("[MailtrapEmailGateway] ❌ Falha ao enviar e-mail para {}: {}", emailDestino, e.getMessage());
            throw new RuntimeException("Falha ao enviar e-mail: " + e.getMessage(), e);
        }
    }

    private String montarCorpoConvite(String nome, String email, String senha, String nomeEmpresa) {
        return """
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px;">
                  <div style="max-width: 520px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 40px; border: 1px solid #334155;">
                    <div style="text-align: center; margin-bottom: 32px;">
                      <h1 style="color: #3b82f6; font-size: 24px; margin: 0;">ContábilPro</h1>
                      <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Plataforma SaaS Contábil</p>
                    </div>

                    <h2 style="color: #f1f5f9; font-size: 20px;">Olá, %s! 👋</h2>
                    <p style="color: #cbd5e1; line-height: 1.6;">
                      Você foi convidado para fazer parte da equipe <strong style="color: #3b82f6;">%s</strong>.
                    </p>

                    <div style="background: #0f172a; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #334155;">
                      <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Suas Credenciais</p>
                      <p style="margin: 4px 0; color: #e2e8f0;"><strong>E-mail:</strong> %s</p>
                      <p style="margin: 4px 0; color: #e2e8f0;"><strong>Senha:</strong> <code style="background: #334155; padding: 2px 8px; border-radius: 4px; color: #fbbf24;">%s</code></p>
                    </div>

                    <p style="color: #94a3b8; font-size: 13px;">
                      ⚠️ Recomendamos que altere sua senha no primeiro acesso em <strong>Alterar Senha</strong>.
                    </p>

                    <div style="text-align: center; margin-top: 32px;">
                      <a href="http://localhost:5173" style="background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                        Acessar Plataforma
                      </a>
                    </div>

                    <hr style="border: none; border-top: 1px solid #334155; margin: 32px 0;">
                    <p style="color: #64748b; font-size: 11px; text-align: center;">
                      Este é um e-mail automático. Não responda.
                    </p>
                  </div>
                </body>
                </html>
                """.formatted(nome, nomeEmpresa, email, senha);
    }
}
