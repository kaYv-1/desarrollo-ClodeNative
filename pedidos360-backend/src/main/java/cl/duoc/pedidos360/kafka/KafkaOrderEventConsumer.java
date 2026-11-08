package cl.duoc.pedidos360.kafka;

import cl.duoc.pedidos360.messaging.OrdenCreadaEvent;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class KafkaOrderEventConsumer {

    private static final Logger logger = LoggerFactory.getLogger(KafkaOrderEventConsumer.class);

    @KafkaListener(
        topics = "${app.kafka.order-created-topic}",
        groupId = "${spring.kafka.consumer.group-id}",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void process(OrdenCreadaEvent event) {
        if (event == null || event.ordenId() == null || event.total() == null) {
            throw new IllegalArgumentException("El evento Kafka de orden no contiene los datos requeridos.");
        }

        logger.info("Evento Kafka de orden procesado. ordenId={}, total={}",
            event.ordenId(), event.total());
    }
}
