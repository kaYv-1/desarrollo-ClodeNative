package cl.duoc.pedidos360.kafka;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import cl.duoc.pedidos360.messaging.OrdenCreadaEvent;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class KafkaOrderNotificationConsumerTest {

    private final KafkaOrderNotificationConsumer consumer = new KafkaOrderNotificationConsumer();

    @Test
    void acceptsValidOrderNotification() {
        OrdenCreadaEvent event = new OrdenCreadaEvent(42L, BigDecimal.TEN, LocalDateTime.now());

        assertDoesNotThrow(() -> consumer.process(event));
    }

    @Test
    void rejectsInvalidOrderNotification() {
        assertThrows(IllegalArgumentException.class,
            () -> consumer.process(new OrdenCreadaEvent(42L, BigDecimal.TEN, null)));
    }
}
