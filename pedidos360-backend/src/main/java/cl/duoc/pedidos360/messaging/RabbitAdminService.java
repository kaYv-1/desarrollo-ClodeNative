package cl.duoc.pedidos360.messaging;

import lombok.RequiredArgsConstructor;
import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Exchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RabbitAdminService {

    private final AmqpAdmin amqpAdmin;

    public void createQueue(String name, boolean durable) {
        amqpAdmin.declareQueue(new Queue(name, durable));
    }

    public void deleteQueue(String name) {
        amqpAdmin.deleteQueue(name);
    }

    public void createExchange(String name, String type, boolean durable) {
        Exchange exchange = "direct".equalsIgnoreCase(type)
            ? new DirectExchange(name, durable, false)
            : new TopicExchange(name, durable, false);
        amqpAdmin.declareExchange(exchange);
    }

    public void deleteExchange(String name) {
        amqpAdmin.deleteExchange(name);
    }

    public void createBinding(String queue, String exchange, String routingKey) {
        amqpAdmin.declareBinding(new Binding(queue, Binding.DestinationType.QUEUE,
            exchange, routingKey, null));
    }

    public void deleteBinding(String queue, String exchange, String routingKey) {
        amqpAdmin.removeBinding(new Binding(queue, Binding.DestinationType.QUEUE,
            exchange, routingKey, null));
    }
}