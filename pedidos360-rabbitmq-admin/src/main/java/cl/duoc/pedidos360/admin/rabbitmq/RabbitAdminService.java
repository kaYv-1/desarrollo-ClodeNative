package cl.duoc.pedidos360.admin.rabbitmq;

import java.util.Map;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

import cl.duoc.pedidos360.messaging.RabbitMessagingProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.Binding.DestinationType;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.FanoutExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RabbitAdminService {

    private static final Pattern RESOURCE_NAME = Pattern.compile("^(?!amq\\.)[A-Za-z0-9][A-Za-z0-9._-]{0,254}$");

    private final RabbitAdmin rabbitAdmin;
    private final RabbitTemplate rabbitTemplate;
    private final RabbitMessagingProperties properties;

    public void createQueue(QueueDefinitionRequest request) {
        validateManagedName(request.name());
        rabbitAdmin.declareQueue(new Queue(
            request.name(),
            request.durable(),
            request.exclusive(),
            request.autoDelete()
        ));
    }

    public void deleteQueue(String name) {
        validateManagedName(name);
        rabbitAdmin.deleteQueue(name);
    }

    public void createExchange(ExchangeDefinitionRequest request) {
        validateManagedName(request.name());
        rabbitAdmin.declareExchange(switch (request.type()) {
            case DIRECT -> new DirectExchange(request.name(), request.durable(), request.autoDelete());
            case FANOUT -> new FanoutExchange(request.name(), request.durable(), request.autoDelete());
            case TOPIC -> new TopicExchange(request.name(), request.durable(), request.autoDelete());
        });
    }

    public void deleteExchange(String name) {
        validateManagedName(name);
        rabbitAdmin.deleteExchange(name);
    }

    public void createBinding(BindingDefinitionRequest request) {
        validateManagedName(request.queueName());
        validateManagedName(request.exchangeName());
        requireQueue(request.queueName());
        requireExchange(request.exchangeName());
        rabbitAdmin.declareBinding(binding(request));
    }

    public void deleteBinding(BindingDefinitionRequest request) {
        validateManagedName(request.queueName());
        validateManagedName(request.exchangeName());
        rabbitAdmin.removeBinding(binding(request));
    }

    private void requireQueue(String name) {
        if (rabbitAdmin.getQueueInfo(name) == null) {
            throw new IllegalArgumentException("La cola indicada no existe.");
        }
    }

    private void requireExchange(String name) {
        rabbitTemplate.execute(channel -> {
            channel.exchangeDeclarePassive(name);
            return null;
        });
    }

    private Binding binding(BindingDefinitionRequest request) {
        return new Binding(
            request.queueName(),
            DestinationType.QUEUE,
            request.exchangeName(),
            request.routingKey(),
            Map.of()
        );
    }

    private void validateManagedName(String name) {
        if (name == null || !RESOURCE_NAME.matcher(name).matches()) {
            throw new IllegalArgumentException("El nombre del recurso RabbitMQ no es válido.");
        }
        if (managedResourceNames().contains(name)) {
            throw new IllegalArgumentException("No se permite administrar la topología interna de pedidos.");
        }
    }

    private Set<String> managedResourceNames() {
        return Set.copyOf(List.of(
            properties.orderCreatedExchange(),
            properties.orderCreatedQueue(),
            properties.deadLetterExchange(),
            properties.deadLetterQueue()
        ));
    }
}
