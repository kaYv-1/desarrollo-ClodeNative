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
        if (event == null || event.ordenId() == null) {
            throw new IllegalArgumentException("El evento Kafka requiere un identificador de orden.");
        }

        return kafkaTemplate.send(
            properties.orderCreatedTopic(),
            event.ordenId().toString(),
            event
        ).whenComplete((result, error) -> {
            if (error == null) {
                logger.info("Evento Kafka de orden publicado. ordenId={}, topic={}",
                    event.ordenId(), properties.orderCreatedTopic());
            } else {
                logger.error("No se pudo publicar el evento Kafka de orden. ordenId={}",
                    event.ordenId(), error);
            }
        });
    }
}
