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
        publicar(event, properties.notificationsRoutingKey(), "notificaciones");
        publicar(event, properties.ticketsRoutingKey(), "tickets");
        publicar(event, properties.documentsRoutingKey(), "documentos");
    }

    private void publicar(OrdenCreadaEvent event, String routingKey, String tarea) {
        try {
            rabbitTemplate.convertAndSend(
                properties.ordersExchange(),
                routingKey,
                event
            );
            logger.info("Tarea de {} publicada. ordenId={}", tarea, event.ordenId());
        } catch (AmqpException exception) {
            logger.error(
                "No se pudo publicar la tarea de {}. ordenId={}",
                tarea,
                event.ordenId(),
                exception
            );
        }
    }
}
