package cl.duoc.pedidos360.kafka;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import cl.duoc.pedidos360.messaging.OrdenCreadaEvent;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class KafkaOrderEventPublisherTest {

    @Test
    void publishesCreatedOrderToBothTopics() {
        KafkaEventProducerService producerService = mock(KafkaEventProducerService.class);
        KafkaOrderEventPublisher publisher = new KafkaOrderEventPublisher(producerService);
        OrdenCreadaEvent event = new OrdenCreadaEvent(42L, BigDecimal.TEN, LocalDateTime.now());

        publisher.publish(event);

        verify(producerService).publishOrderCreated(event);
        verify(producerService).publishOrderNotification(event);
    }
}
