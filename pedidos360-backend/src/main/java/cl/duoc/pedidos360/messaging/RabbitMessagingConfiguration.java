package cl.duoc.pedidos360.messaging;

import java.util.Map;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
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
    public TopicExchange ordersExchange(RabbitMessagingProperties properties) {
        return new TopicExchange(properties.ordersExchange(), true, false);
    }

    @Bean
    public DirectExchange deadLetterExchange(RabbitMessagingProperties properties) {
        return new DirectExchange(properties.deadLetterExchange(), true, false);
    }

    @Bean
    public Queue notificationsQueue(RabbitMessagingProperties properties) {
        return QueueBuilder.durable(properties.notificationsQueue())
            .withArguments(Map.of(
                "x-dead-letter-exchange", properties.deadLetterExchange(),
                "x-dead-letter-routing-key", properties.notificationsDeadLetterRoutingKey()
            ))
            .build();
    }

    @Bean
    public Queue ticketsQueue(RabbitMessagingProperties properties) {
        return QueueBuilder.durable(properties.ticketsQueue())
            .withArguments(Map.of(
                "x-dead-letter-exchange", properties.deadLetterExchange(),
                "x-dead-letter-routing-key", properties.ticketsDeadLetterRoutingKey()
            ))
            .build();
    }

    @Bean
    public Queue documentsQueue(RabbitMessagingProperties properties) {
        return QueueBuilder.durable(properties.documentsQueue())
            .withArguments(Map.of(
                "x-dead-letter-exchange", properties.deadLetterExchange(),
                "x-dead-letter-routing-key", properties.documentsDeadLetterRoutingKey()
            ))
            .build();
    }

    @Bean
    public Queue notificationsDeadLetterQueue(RabbitMessagingProperties properties) {
        return QueueBuilder.durable(properties.notificationsDeadLetterQueue()).build();
    }

    @Bean
    public Queue ticketsDeadLetterQueue(RabbitMessagingProperties properties) {
        return QueueBuilder.durable(properties.ticketsDeadLetterQueue()).build();
    }

    @Bean
    public Queue documentsDeadLetterQueue(RabbitMessagingProperties properties) {
        return QueueBuilder.durable(properties.documentsDeadLetterQueue()).build();
    }

    @Bean
    public Binding notificationsBinding(
        @Qualifier("notificationsQueue") Queue queue,
        @Qualifier("ordersExchange") TopicExchange exchange,
        RabbitMessagingProperties properties
    ) {
        return BindingBuilder.bind(queue).to(exchange).with(properties.notificationsRoutingKey());
    }

    @Bean
    public Binding ticketsBinding(
        @Qualifier("ticketsQueue") Queue queue,
        @Qualifier("ordersExchange") TopicExchange exchange,
        RabbitMessagingProperties properties
    ) {
        return BindingBuilder.bind(queue).to(exchange).with(properties.ticketsRoutingKey());
    }

    @Bean
    public Binding documentsBinding(
        @Qualifier("documentsQueue") Queue queue,
        @Qualifier("ordersExchange") TopicExchange exchange,
        RabbitMessagingProperties properties
    ) {
        return BindingBuilder.bind(queue).to(exchange).with(properties.documentsRoutingKey());
    }

    @Bean
    public Binding notificationsDeadLetterBinding(
        @Qualifier("notificationsDeadLetterQueue") Queue queue,
        @Qualifier("deadLetterExchange") DirectExchange exchange,
        RabbitMessagingProperties properties
    ) {
        return BindingBuilder.bind(queue).to(exchange).with(properties.notificationsDeadLetterRoutingKey());
    }

    @Bean
    public Binding ticketsDeadLetterBinding(
        @Qualifier("ticketsDeadLetterQueue") Queue queue,
        @Qualifier("deadLetterExchange") DirectExchange exchange,
        RabbitMessagingProperties properties
    ) {
        return BindingBuilder.bind(queue).to(exchange).with(properties.ticketsDeadLetterRoutingKey());
    }

    @Bean
    public Binding documentsDeadLetterBinding(
        @Qualifier("documentsDeadLetterQueue") Queue queue,
        @Qualifier("deadLetterExchange") DirectExchange exchange,
        RabbitMessagingProperties properties
    ) {
        return BindingBuilder.bind(queue).to(exchange).with(properties.documentsDeadLetterRoutingKey());
    }
}
