package cl.duoc.pedidos360.messaging;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.rabbitmq.client.Channel;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class OrdenDocumentoConsumerTest {

    private final OrdenDocumentoConsumer consumer = new OrdenDocumentoConsumer();

    @Test
    void confirmaDocumentoProcesado() throws Exception {
        Channel channel = mock(Channel.class);
        OrdenCreadaEvent event = new OrdenCreadaEvent(42L, new BigDecimal("12500.00"), LocalDateTime.now());

        consumer.procesarDocumento(event, channel, 10L);

        verify(channel).basicAck(10L, false);
    }

    @Test
    void enviaDocumentoInvalidoALaDlq() throws Exception {
        Channel channel = mock(Channel.class);

        consumer.procesarDocumento(null, channel, 12L);

        verify(channel).basicNack(12L, false, false);
    }
}
