package cl.duoc.pedidos360.kafka;

import java.util.concurrent.CompletableFuture;

import cl.duoc.pedidos360.messaging.OrdenCreadaEvent;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class KafkaEventProducerService {

    private static final Logger logger = LoggerFactory.getLogger(KafkaEventProducerService.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final KafkaMessagingProperties properties;

    public CompletableFuture<?> publishOrderCreated(OrdenCreadaEvent event) {
        return publish(event, properties.orderCreatedTopic());
    }

    public CompletableFuture<?> publishOrderNotification(OrdenCreadaEvent event) {
        return publish(event, properties.orderNotificationTopic());
    }

    private CompletableFuture<?> publish(OrdenCreadaEvent event, String topic) {
        if (event == null || event.ordenId() == null) {
            throw new IllegalArgumentException("El evento Kafka requiere un identificador de orden.");
        }

        return kafkaTemplate.send(
            topic,
            event.ordenId().toString(),
            event
        ).whenComplete((result, error) -> {
            if (error == null) {
                logger.info("Evento Kafka publicado. ordenId={}, topic={}", event.ordenId(), topic);
            } else {
                logger.error("No se pudo publicar el evento Kafka. ordenId={}, topic={}",
                    event.ordenId(), topic, error);
            }
        });
    }
}
