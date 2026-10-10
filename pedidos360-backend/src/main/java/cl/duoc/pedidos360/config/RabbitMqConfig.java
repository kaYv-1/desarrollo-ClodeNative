package cl.duoc.pedidos360.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Configuration
@EnableConfigurationProperties(RabbitMqProperties.class)
public class RabbitMqConfig {

    public static final String DEAD_LETTER_ROUTING_KEY = "order.notifications.dlq";

    @Bean
    MessageConverter rabbitMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    TopicExchange ordersExchange(RabbitMqProperties properties) {
        return new TopicExchange(properties.getExchangeOrders(), true, false);
    }

    @Bean
    DirectExchange deadLetterExchange(RabbitMqProperties properties) {
        return new DirectExchange(properties.getExchangeDeadLetter(), true, false);
    }

    @Bean
    Queue orderNotificationsDlq(RabbitMqProperties properties) {
        return new Queue(properties.getQueue().getOrderNotificationsDlq(), true);
    }

    @Bean
    Queue orderNotificationsQueue(RabbitMqProperties properties) {
        return new Queue(properties.getQueue().getOrderNotifications(), true, false, false,
            Map.of(
                "x-dead-letter-exchange", properties.getExchangeDeadLetter(),
                "x-dead-letter-routing-key", DEAD_LETTER_ROUTING_KEY));
    }

    @Bean
    Binding orderNotificationsBinding(Queue orderNotificationsQueue,
                                      TopicExchange ordersExchange,
                                      RabbitMqProperties properties) {
        return BindingBuilder.bind(orderNotificationsQueue)
            .to(ordersExchange)
            .with(properties.getRoutingKeyOrderCreated());
    }

    @Bean
    Binding orderNotificationsDlqBinding(Queue orderNotificationsDlq,
                                        DirectExchange deadLetterExchange) {
        return BindingBuilder.bind(orderNotificationsDlq)
            .to(deadLetterExchange)
            .with(DEAD_LETTER_ROUTING_KEY);
    }
}