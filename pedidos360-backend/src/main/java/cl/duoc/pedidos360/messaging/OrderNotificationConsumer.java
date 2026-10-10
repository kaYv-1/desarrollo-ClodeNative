package cl.duoc.pedidos360.messaging;

import com.rabbitmq.client.Channel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderNotificationConsumer {

    @RabbitListener(queues = "${app.rabbitmq.queue.order-notifications}")
    public void consume(OrderCreatedEvent event, Message message, Channel channel) throws Exception {
        long deliveryTag = message.getMessageProperties().getDeliveryTag();
        try {
            log.info("Procesando notificacion de orden creada: orderId={}, email={}",
                event.orderId(), event.customerEmail());
            channel.basicAck(deliveryTag, false);
        } catch (Exception exception) {
            log.error("No se pudo procesar la orden {}; se envia a DLQ", event.orderId(), exception);
            channel.basicNack(deliveryTag, false, false);
        }
    }
}