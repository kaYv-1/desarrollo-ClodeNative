package cl.duoc.pedidos360.messaging;

import java.io.IOException;

import com.rabbitmq.client.Channel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

@Component
public class OrdenDocumentoConsumer {

    private static final Logger logger = LoggerFactory.getLogger(OrdenDocumentoConsumer.class);

    @RabbitListener(queues = "${app.messaging.documents-queue}")
    public void procesarDocumento(
        OrdenCreadaEvent event,
        Channel channel,
        @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag
    ) throws IOException {
        try {
            validar(event);
            logger.info("Solicitud de generación de documento procesada. ordenId={}", event.ordenId());
            channel.basicAck(deliveryTag, false);
        } catch (RuntimeException exception) {
            logger.error("No se pudo procesar el documento; se enviará a la DLQ.", exception);
            channel.basicNack(deliveryTag, false, false);
        }
    }

    private void validar(OrdenCreadaEvent event) {
        if (event == null || event.ordenId() == null || event.total() == null) {
            throw new IllegalArgumentException("El evento de orden no contiene los datos requeridos.");
        }
    }
}
