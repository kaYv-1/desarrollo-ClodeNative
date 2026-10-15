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
class OrderTicketConsumerTest {

    @Mock
    private Channel channel;

    @Mock
    private Message message;

    @Mock
    private MessageProperties messageProperties;

    private OrderTicketConsumer consumer;

    @BeforeEach
    void setUp() {
        consumer = new OrderTicketConsumer();
        when(message.getMessageProperties()).thenReturn(messageProperties);
        when(messageProperties.getDeliveryTag()).thenReturn(202L);
    }

    @Test
    void confirmacionManualAckCuandoGeneracionDeTicketEsExitosa() throws Exception {
        OrderCreatedEvent event = new OrderCreatedEvent(
            2L, "cliente@example.com", new BigDecimal("45990.00"), LocalDateTime.now());

        consumer.consume(event, message, channel);

        verify(channel).basicAck(202L, false);
    }

    @Test
    void confirmacionNackHaciaDLQSinRequeueCuandoFaltaTotal() throws Exception {
        // Evento con total nulo provocara error en la generacion del comprobante
        OrderCreatedEvent event = new OrderCreatedEvent(
            2L, "cliente@example.com", null, LocalDateTime.now());

        consumer.consume(event, message, channel);

        // requeue=false desvia el mensaje a la Dead-Letter Queue de tickets
        verify(channel).basicNack(202L, false, false);
    }
}
