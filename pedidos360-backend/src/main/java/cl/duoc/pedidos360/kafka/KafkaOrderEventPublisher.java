package cl.duoc.pedidos360.kafka;

import cl.duoc.pedidos360.messaging.OrdenCreadaEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class KafkaOrderEventPublisher {

    private final KafkaEventProducerService producerService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void publish(OrdenCreadaEvent event) {
        producerService.publishOrderCreated(event);
    }
}
