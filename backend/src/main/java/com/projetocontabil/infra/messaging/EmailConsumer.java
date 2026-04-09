package com.projetocontabil.infra.messaging;

import com.projetocontabil.infra.config.RabbitMQConfig;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Consumidor RabbitMQ para disparo de e-mails.
 * Realiza o envio final via SMTP (conectado ao MailTrap em dev).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailConsumer {

    private final JavaMailSender mailSender;

    @RabbitListener(queues = RabbitMQConfig.EMAIL_QUEUE)
    public void processarEnvioEmail(EmailProducer.EmailPayload payload) {
        log.info("[RabbitMQ] Recebida solicitação de e-mail para: {}. Assunto: {}", payload.getPara(), payload.getAssunto());

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(payload.getPara());
            helper.setSubject(payload.getAssunto());
            helper.setText(payload.getCorpo(), true); // true = HTML
            helper.setFrom("no-reply@projetocontabil.com.br");

            mailSender.send(message);
            log.info("[RabbitMQ] E-mail enviado com sucesso para: {}", payload.getPara());

        } catch (Exception e) {
            log.error("[RabbitMQ] FALHA CRÍTICA ao realizar o envio final para {}: {}. Mensagem descartada para evitar loop.", 
                      payload.getPara(), e.getMessage());
            // Ao não relançar a exceção, o RabbitMQ remove a mensagem da fila (ACK implícito).
        }
    }
}
