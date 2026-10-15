package cl.duoc.pedidos360.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class OrdenCreadaPublisher {

    private static final Logger logger = LoggerFactory.getLogger(OrdenCreadaPublisher.class);

    private final RabbitTemplate rabbitTemplate;
    private final RabbitMessagingProperties properties;

    public OrdenCreadaPublisher(RabbitTemplate rabbitTemplate, RabbitMessagingProperties properties) {
        this.rabbitTemplate = rabbitTemplate;
        this.properties = properties;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void publicarOrdenCreada(OrdenCreadaEvent event) {
        try {
            rabbitTemplate.convertAndSend(
                properties.orderCreatedExchange(),
                properties.orderCreatedRoutingKey(),
                event
            );
            logger.info("Evento de creación de orden publicado. ordenId={}", event.ordenId());
        } catch (AmqpException exception) {
            logger.error(
                "No se pudo publicar el evento de creación de orden. ordenId={}",
                event.ordenId(),
                exception
            );
        }
    }
}
