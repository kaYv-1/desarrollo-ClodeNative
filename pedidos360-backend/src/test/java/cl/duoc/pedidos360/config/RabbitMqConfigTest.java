package cl.duoc.pedidos360.config;

import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.Queue;

import static org.assertj.core.api.Assertions.assertThat;

class RabbitMqConfigTest {

    @Test
    void declaraColaNotificacionesConRutaDLQ() {
        RabbitMqProperties properties = properties();
        RabbitMqConfig config = new RabbitMqConfig();

        Queue queue = config.orderNotificationsQueue(properties);

        assertThat(queue.getName()).isEqualTo("orders.notifications");
        assertThat(queue.getArguments())
            .containsEntry("x-dead-letter-exchange", "orders.dlx")
            .containsEntry("x-dead-letter-routing-key", "order.notifications.dlq");
    }

    @Test
    void declaraBindingDeLaDLQNotificaciones() {
        RabbitMqConfig config = new RabbitMqConfig();
        RabbitMqProperties properties = properties();
        Queue dlq = config.orderNotificationsDlq(properties);

        Binding binding = config.orderNotificationsDlqBinding(
            dlq, config.deadLetterExchange(properties), properties);

        assertThat(binding.getDestination()).isEqualTo("orders.notifications.dlq");
        assertThat(binding.getRoutingKey()).isEqualTo("order.notifications.dlq");
    }

    @Test
    void declaraColaTicketsConRutaDLQ() {
        RabbitMqProperties properties = properties();
        RabbitMqConfig config = new RabbitMqConfig();

        Queue queue = config.orderTicketsQueue(properties);

        assertThat(queue.getName()).isEqualTo("orders.tickets");
        assertThat(queue.getArguments())
            .containsEntry("x-dead-letter-exchange", "orders.dlx")
            .containsEntry("x-dead-letter-routing-key", "order.tickets.dlq");
    }

    @Test
    void declaraBindingDeLaDLQTickets() {
        RabbitMqConfig config = new RabbitMqConfig();
        RabbitMqProperties properties = properties();
        Queue dlq = config.orderTicketsDlq(properties);

        Binding binding = config.orderTicketsDlqBinding(
            dlq, config.deadLetterExchange(properties), properties);

        assertThat(binding.getDestination()).isEqualTo("orders.tickets.dlq");
        assertThat(binding.getRoutingKey()).isEqualTo("order.tickets.dlq");
    }

    private RabbitMqProperties properties() {
        RabbitMqProperties properties = new RabbitMqProperties();
        properties.setExchangeOrders("orders.events");
        properties.setExchangeDeadLetter("orders.dlx");
        properties.setRoutingKeyOrderCreated("order.created");
        properties.setRoutingKeyDeadLetter("order.notifications.dlq");
        properties.setRoutingKeyDeadLetterTickets("order.tickets.dlq");

        properties.getQueue().setOrderNotifications("orders.notifications");
        properties.getQueue().setOrderNotificationsDlq("orders.notifications.dlq");
        properties.getQueue().setOrderTickets("orders.tickets");
        properties.getQueue().setOrderTicketsDlq("orders.tickets.dlq");
        return properties;
    }
}