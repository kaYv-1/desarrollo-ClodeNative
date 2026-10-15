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
public class OrdenNotificacionConsumer {

    private static final Logger logger = LoggerFactory.getLogger(OrdenNotificacionConsumer.class);

    @RabbitListener(queues = "${app.messaging.order-created-queue}")
    public void procesarOrden(
        OrdenCreadaEvent event,
        Channel channel,
        @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag
    ) throws IOException {
        try {
            if (event == null || event.ordenId() == null || event.total() == null) {
                throw new IllegalArgumentException("El evento de orden no contiene los datos requeridos.");
            }

            logger.info(
                "Solicitud de notificación de orden procesada. ordenId={}, total={}",
                event.ordenId(),
                event.total()
            );
            channel.basicAck(deliveryTag, false);
        } catch (RuntimeException exception) {
            logger.error(
                "No se pudo procesar el evento de orden; se enviará a la DLQ. deliveryTag={}",
                deliveryTag,
                exception
            );
            channel.basicNack(deliveryTag, false, false);
        }
    }
}
