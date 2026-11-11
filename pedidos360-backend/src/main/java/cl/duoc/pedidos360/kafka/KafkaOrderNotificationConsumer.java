package cl.duoc.pedidos360.kafka;

import cl.duoc.pedidos360.messaging.OrdenCreadaEvent;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class KafkaOrderNotificationConsumer {

    private static final Logger logger = LoggerFactory.getLogger(KafkaOrderNotificationConsumer.class);

    @KafkaListener(
        topics = "${app.kafka.order-notification-topic}",
        groupId = "${app.kafka.notification-consumer-group}",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void process(OrdenCreadaEvent event) {
        if (event == null || event.ordenId() == null || event.fechaCreacion() == null) {
            throw new IllegalArgumentException("El evento Kafka de notificación no contiene los datos requeridos.");
        }

        logger.info("Evento Kafka de notificación procesado. ordenId={}, fechaCreacion={}",
            event.ordenId(), event.fechaCreacion());
    }
}
