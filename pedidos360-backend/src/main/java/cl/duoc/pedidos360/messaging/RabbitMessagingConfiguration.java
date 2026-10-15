package cl.duoc.pedidos360.messaging;

import java.util.Map;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(RabbitMessagingProperties.class)
public class RabbitMessagingConfiguration {

    @Bean
    public RabbitAdmin rabbitAdmin(ConnectionFactory connectionFactory) {
        return new RabbitAdmin(connectionFactory);
    }

    @Bean
    public MessageConverter rabbitMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public DirectExchange orderCreatedExchange(RabbitMessagingProperties properties) {
        return new DirectExchange(properties.orderCreatedExchange(), true, false);
    }

    @Bean
    public DirectExchange deadLetterExchange(RabbitMessagingProperties properties) {
        return new DirectExchange(properties.deadLetterExchange(), true, false);
    }

    @Bean
    public Queue orderCreatedQueue(RabbitMessagingProperties properties) {
        return QueueBuilder.durable(properties.orderCreatedQueue())
            .withArguments(Map.of(
                "x-dead-letter-exchange", properties.deadLetterExchange(),
                "x-dead-letter-routing-key", properties.deadLetterRoutingKey()
            ))
            .build();
    }

    @Bean
    public Queue orderCreatedDeadLetterQueue(RabbitMessagingProperties properties) {
        return QueueBuilder.durable(properties.deadLetterQueue()).build();
    }

    @Bean
    public Binding orderCreatedBinding(
        @Qualifier("orderCreatedQueue") Queue queue,
        @Qualifier("orderCreatedExchange") DirectExchange exchange,
        RabbitMessagingProperties properties
    ) {
        return BindingBuilder.bind(queue).to(exchange).with(properties.orderCreatedRoutingKey());
    }

    @Bean
    public Binding orderCreatedDeadLetterBinding(
        @Qualifier("orderCreatedDeadLetterQueue") Queue queue,
        @Qualifier("deadLetterExchange") DirectExchange exchange,
        RabbitMessagingProperties properties
    ) {
        return BindingBuilder.bind(queue).to(exchange).with(properties.deadLetterRoutingKey());
    }
}
