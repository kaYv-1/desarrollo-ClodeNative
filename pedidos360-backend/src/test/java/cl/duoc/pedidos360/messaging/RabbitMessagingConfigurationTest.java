package cl.duoc.pedidos360.messaging;

import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;

import static org.assertj.core.api.Assertions.assertThat;

class RabbitMessagingConfigurationTest {

    private final RabbitMessagingProperties properties = new RabbitMessagingProperties(
        "pedidos360.orders",
        "pedidos360.dead-letter",
        "pedidos360.order-notifications",
        "pedidos360.order-notifications.dlq",
        "order.created.notifications",
        "order.notifications.dlq",
        "pedidos360.order-tickets",
        "pedidos360.order-tickets.dlq",
        "order.created.tickets",
        "order.tickets.dlq",
        "pedidos360.order-documents",
        "pedidos360.order-documents.dlq",
        "order.created.documents",
        "order.documents.dlq"
    );
    private final RabbitMessagingConfiguration configuration = new RabbitMessagingConfiguration();

    @Test
    void declaraExchangesTopicYDirect() {
        TopicExchange orders = configuration.ordersExchange(properties);
        DirectExchange deadLetters = configuration.deadLetterExchange(properties);

        assertThat(orders.getName()).isEqualTo("pedidos360.orders");
        assertThat(deadLetters.getName()).isEqualTo("pedidos360.dead-letter");
    }

    @Test
    void declaraTresColasCadaUnaConSuDlq() {
        assertDlq(configuration.notificationsQueue(properties), "order.notifications.dlq");
        assertDlq(configuration.ticketsQueue(properties), "order.tickets.dlq");
        assertDlq(configuration.documentsQueue(properties), "order.documents.dlq");
    }

    private void assertDlq(Queue queue, String deadLetterRoutingKey) {
        assertThat(queue.isDurable()).isTrue();
        assertThat(queue.getArguments())
            .containsEntry("x-dead-letter-exchange", "pedidos360.dead-letter")
            .containsEntry("x-dead-letter-routing-key", deadLetterRoutingKey);
    }
}
