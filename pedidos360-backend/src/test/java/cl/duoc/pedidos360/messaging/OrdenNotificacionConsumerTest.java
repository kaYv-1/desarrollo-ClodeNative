package cl.duoc.pedidos360.messaging;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.rabbitmq.client.Channel;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class OrdenNotificacionConsumerTest {

    private final OrdenNotificacionConsumer consumer = new OrdenNotificacionConsumer();

    @Test
    void confirmaMensajeProcesado() throws Exception {
        Channel channel = mock(Channel.class);
        OrdenCreadaEvent event = new OrdenCreadaEvent(42L, new BigDecimal("12500.00"), LocalDateTime.now());

        consumer.procesarOrden(event, channel, 7L);

        verify(channel).basicAck(7L, false);
    }

    @Test
    void rechazaMensajeInvalidoSinReencolarlo() throws Exception {
        Channel channel = mock(Channel.class);

        consumer.procesarOrden(null, channel, 8L);

        verify(channel).basicNack(8L, false, false);
    }
}
