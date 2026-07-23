package com.projetocontabil.infra.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
public class MailConfig {

    @Bean
    @ConditionalOnMissingBean(JavaMailSender.class)
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(System.getenv().getOrDefault("SPRING_MAIL_HOST", "sandbox.smtp.mailtrap.io"));
        
        String portStr = System.getenv("SPRING_MAIL_PORT");
        int port = (portStr != null && !portStr.isBlank()) ? Integer.parseInt(portStr) : 2525;
        mailSender.setPort(port);
        
        mailSender.setUsername(System.getenv().getOrDefault("SPRING_MAIL_USERNAME", "mock_user"));
        mailSender.setPassword(System.getenv().getOrDefault("SPRING_MAIL_PASSWORD", "mock_pass"));

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.debug", "false");

        return mailSender;
    }
}
