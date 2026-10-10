package cl.duoc.pedidos360.config;

import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.Queue;

import static org.assertj.core.api.Assertions.assertThat;

class RabbitMqConfigTest {

    @Test
    void declaraColaPrincipalConRutaDLQ() {
        RabbitMqProperties properties = properties();
        RabbitMqConfig config = new RabbitMqConfig();

        Queue queue = config.orderNotificationsQueue(properties);

        assertThat(queue.getName()).isEqualTo("orders.notifications");
        assertThat(queue.getArguments())
            .containsEntry("x-dead-letter-exchange", "orders.dlx")
            .containsEntry("x-dead-letter-routing-key", RabbitMqConfig.DEAD_LETTER_ROUTING_KEY);
    }

    @Test
    void declaraBindingDeLaDLQ() {
        RabbitMqConfig config = new RabbitMqConfig();
        RabbitMqProperties properties = properties();
        Queue dlq = config.orderNotificationsDlq(properties);

        Binding binding = config.orderNotificationsDlqBinding(
            dlq, config.deadLetterExchange(properties));

        assertThat(binding.getDestination()).isEqualTo("orders.notifications.dlq");
        assertThat(binding.getRoutingKey()).isEqualTo(RabbitMqConfig.DEAD_LETTER_ROUTING_KEY);
    }

    private RabbitMqProperties properties() {
        RabbitMqProperties properties = new RabbitMqProperties();
        properties.setExchangeOrders("orders.events");
        properties.setExchangeDeadLetter("orders.dlx");
        properties.getQueue().setOrderNotifications("orders.notifications");
        properties.getQueue().setOrderNotificationsDlq("orders.notifications.dlq");
        properties.setRoutingKeyOrderCreated("order.created");
        return properties;
    }
}