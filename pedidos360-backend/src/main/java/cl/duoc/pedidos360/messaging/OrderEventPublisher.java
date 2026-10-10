package cl.duoc.pedidos360.messaging;

import cl.duoc.pedidos360.config.RabbitMqProperties;
import cl.duoc.pedidos360.model.Orden;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OrderEventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final RabbitMqProperties properties;

    public void publishCreated(Orden order) {
        String email = order.getCliente() == null ? null : order.getCliente().getEmail();
        OrderCreatedEvent event = new OrderCreatedEvent(
            order.getId(), email, order.getTotal(), order.getFechaCreacion());
        rabbitTemplate.convertAndSend(
            properties.getExchangeOrders(),
            properties.getRoutingKeyOrderCreated(),
            event);
    }
}