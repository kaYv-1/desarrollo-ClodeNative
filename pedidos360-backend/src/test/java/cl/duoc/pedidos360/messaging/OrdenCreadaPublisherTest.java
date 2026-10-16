package cl.duoc.pedidos360.messaging;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OrdenCreadaPublisherTest {

    @Test
    void publicaUnaTareaEnCadaRoutingKeyConfigurada() {
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        RabbitMessagingProperties properties = mock(RabbitMessagingProperties.class);
        when(properties.ordersExchange()).thenReturn("pedidos360.orders");
        when(properties.notificationsRoutingKey()).thenReturn("order.created.notifications");
        when(properties.ticketsRoutingKey()).thenReturn("order.created.tickets");
        when(properties.documentsRoutingKey()).thenReturn("order.created.documents");

        OrdenCreadaPublisher publisher = new OrdenCreadaPublisher(rabbitTemplate, properties);
        OrdenCreadaEvent event = new OrdenCreadaEvent(
            42L,
            new BigDecimal("12500.00"),
            LocalDateTime.now()
        );

        publisher.publicarOrdenCreada(event);

        verify(rabbitTemplate).convertAndSend("pedidos360.orders", "order.created.notifications", event);
        verify(rabbitTemplate).convertAndSend("pedidos360.orders", "order.created.tickets", event);
        verify(rabbitTemplate).convertAndSend("pedidos360.orders", "order.created.documents", event);
    }
}
