package cl.duoc.pedidos360.kafka;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import cl.duoc.pedidos360.messaging.OrdenCreadaEvent;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class KafkaOrderEventConsumerTest {

    private final KafkaOrderEventConsumer consumer = new KafkaOrderEventConsumer();

    @Test
    void acceptsValidOrderEvent() {
        OrdenCreadaEvent event = new OrdenCreadaEvent(42L, BigDecimal.TEN, LocalDateTime.now());

        assertDoesNotThrow(() -> consumer.process(event));
    }

    @Test
    void rejectsOrderEventWithoutRequiredFields() {
        assertThrows(IllegalArgumentException.class,
            () -> consumer.process(new OrdenCreadaEvent(42L, null, LocalDateTime.now())));
    }
}
