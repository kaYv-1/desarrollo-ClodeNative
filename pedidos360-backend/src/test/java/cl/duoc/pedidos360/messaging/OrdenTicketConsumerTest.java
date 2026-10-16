package cl.duoc.pedidos360.messaging;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.rabbitmq.client.Channel;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class OrdenTicketConsumerTest {

    private final OrdenTicketConsumer consumer = new OrdenTicketConsumer();

    @Test
    void confirmaTicketProcesado() throws Exception {
        Channel channel = mock(Channel.class);
        OrdenCreadaEvent event = new OrdenCreadaEvent(42L, new BigDecimal("12500.00"), LocalDateTime.now());

        consumer.procesarTicket(event, channel, 9L);

        verify(channel).basicAck(9L, false);
    }

    @Test
    void enviaTicketInvalidoALaDlq() throws Exception {
        Channel channel = mock(Channel.class);

        consumer.procesarTicket(null, channel, 11L);

        verify(channel).basicNack(11L, false, false);
    }
}
