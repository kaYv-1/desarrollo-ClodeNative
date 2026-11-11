package cl.duoc.pedidos360.kafka;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;

import cl.duoc.pedidos360.messaging.OrdenCreadaEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class KafkaEventProducerServiceTest {

    private KafkaTemplate<String, Object> kafkaTemplate;
    private KafkaEventProducerService producerService;

    @BeforeEach
    void setUp() {
        kafkaTemplate = mock(KafkaTemplate.class);
        KafkaMessagingProperties properties = new KafkaMessagingProperties(
            "orders.created",
            "orders.notifications",
            "notifications-group",
            3,
            (short) 3,
            604800000L,
            "delete"
        );
        producerService = new KafkaEventProducerService(kafkaTemplate, properties);
        when(kafkaTemplate.send(org.mockito.ArgumentMatchers.anyString(),
            org.mockito.ArgumentMatchers.anyString(),
            org.mockito.ArgumentMatchers.any()))
            .thenReturn(CompletableFuture.completedFuture(mock(SendResult.class)));
    }

    @Test
    void publishesOrderToCreatedTopic() {
        OrdenCreadaEvent event = event();

        producerService.publishOrderCreated(event);

        verify(kafkaTemplate).send("orders.created", "42", event);
    }

    @Test
    void publishesOrderToNotificationTopic() {
        OrdenCreadaEvent event = event();

        producerService.publishOrderNotification(event);

        verify(kafkaTemplate).send("orders.notifications", "42", event);
    }

    @Test
    void rejectsEventsWithoutOrderId() {
        assertThrows(IllegalArgumentException.class,
            () -> producerService.publishOrderCreated(new OrdenCreadaEvent(null, BigDecimal.TEN, LocalDateTime.now())));
    }

    private OrdenCreadaEvent event() {
        return new OrdenCreadaEvent(42L, BigDecimal.TEN, LocalDateTime.now());
    }
}
