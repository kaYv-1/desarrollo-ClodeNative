package cl.duoc.pedidos360.messaging;

import cl.duoc.pedidos360.config.RabbitMqProperties;
import cl.duoc.pedidos360.model.Cliente;
import cl.duoc.pedidos360.model.Orden;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class OrderEventPublisherTest {

    @Mock
    private RabbitTemplate rabbitTemplate;

    @Test
    void publicaEventoDeOrdenCreadaEnExchangeConfigurado() {
        RabbitMqProperties properties = new RabbitMqProperties();
        properties.setExchangeOrders("orders.events");
        properties.setRoutingKeyOrderCreated("order.created");

        OrderEventPublisher publisher = new OrderEventPublisher(rabbitTemplate, properties);
        Cliente customer = new Cliente();
        customer.setEmail("cliente@example.com");
        Orden order = new Orden();
        order.setId(42L);
        order.setCliente(customer);
        order.setTotal(new BigDecimal("12500.00"));

        publisher.publishCreated(order);

        ArgumentCaptor<OrderCreatedEvent> eventCaptor = ArgumentCaptor.forClass(OrderCreatedEvent.class);
        verify(rabbitTemplate).convertAndSend(
            org.mockito.ArgumentMatchers.eq("orders.events"),
            org.mockito.ArgumentMatchers.eq("order.created"),
            eventCaptor.capture());
        assertThat(eventCaptor.getValue().orderId()).isEqualTo(42L);
        assertThat(eventCaptor.getValue().customerEmail()).isEqualTo("cliente@example.com");
        assertThat(eventCaptor.getValue().total()).isEqualByComparingTo("12500.00");
    }
}