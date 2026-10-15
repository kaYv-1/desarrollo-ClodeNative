package cl.duoc.pedidos360.messaging;

import com.rabbitmq.client.Channel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderNotificationConsumerTest {

    @Mock
    private Channel channel;

    @Mock
    private Message message;

    @Mock
    private MessageProperties messageProperties;

    private OrderNotificationConsumer consumer;

    @BeforeEach
    void setUp() {
        consumer = new OrderNotificationConsumer();
        when(message.getMessageProperties()).thenReturn(messageProperties);
        when(messageProperties.getDeliveryTag()).thenReturn(101L);
    }

    @Test
    void confirmacionManualAckCuandoProcesamientoEsExitoso() throws Exception {
        OrderCreatedEvent event = new OrderCreatedEvent(
            1L, "cliente@example.com", new BigDecimal("19990.00"), LocalDateTime.now());

        consumer.consume(event, message, channel);

        verify(channel).basicAck(101L, false);
    }

    @Test
    void confirmacionNackHaciaDLQSinRequeueCuandoFalla() throws Exception {
        // Evento con orderId invalido provocara excepcion en logica de negocio
        OrderCreatedEvent event = new OrderCreatedEvent(
            -5L, "invalido@example.com", new BigDecimal("19990.00"), LocalDateTime.now());

        consumer.consume(event, message, channel);

        // requeue=false desvia el mensaje a la Dead-Letter Queue
        verify(channel).basicNack(101L, false, false);
    }
}
