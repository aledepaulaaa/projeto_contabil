package com.projetocontabil.infra.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuração do RabbitMQ para processamento assíncrono de contratos.
 */
@Configuration
public class RabbitMQConfig {

    public static final String CONTRATO_QUEUE = "contrato.gerar";
    public static final String CONTRATO_EXCHANGE = "contrato.exchange";
    public static final String CONTRATO_ROUTING_KEY = "contrato.gerar.routing";
    
    public static final String WHATSAPP_QUEUE = "q.whatsapp.envio";
    public static final String WHATSAPP_ROUTING_KEY = "whatsapp.notificacao";
    public static final String EMAIL_QUEUE = "q.email.envio";
    public static final String EMAIL_ROUTING_KEY = "email.notificacao";

    @Bean
    public Queue contratoQueue() {
        return new Queue(CONTRATO_QUEUE, true);
    }

    @Bean
    public DirectExchange contratoExchange() {
        return new DirectExchange(CONTRATO_EXCHANGE);
    }

    @Bean
    public Binding contratoBinding(Queue contratoQueue, DirectExchange contratoExchange) {
        return BindingBuilder.bind(contratoQueue).to(contratoExchange).with(CONTRATO_ROUTING_KEY);
    }

    @Bean
    public Queue whatsappQueue() {
        return new Queue(WHATSAPP_QUEUE, true);
    }

    @Bean
    public Queue emailQueue() {
        return new Queue(EMAIL_QUEUE, true);
    }

    @Bean
    public Binding whatsappBinding(Queue whatsappQueue, DirectExchange contratoExchange) {
        return BindingBuilder.bind(whatsappQueue).to(contratoExchange).with(WHATSAPP_ROUTING_KEY);
    }

    @Bean
    public Binding emailBinding(Queue emailQueue, DirectExchange contratoExchange) {
        return BindingBuilder.bind(emailQueue).to(contratoExchange).with(EMAIL_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
