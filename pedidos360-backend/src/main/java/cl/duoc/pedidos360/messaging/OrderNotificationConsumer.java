package cl.duoc.pedidos360.messaging;

import com.rabbitmq.client.Channel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Consumidor asincrono del dominio de Notificaciones de Pedidos.
 * Gestiona el envio de alertas por correo al cliente cuando una orden es creada.
 *
 * Politica de Confirmacion:
 * - Modo manual (AcknowledgeMode.MANUAL).
 * - Exito: Confirma el mensaje con basicAck.
 * - Error recuperable/no recuperable: Envia basicNack con requeue=false para
 *   que la configuracion de la cola lo desvie inmediatamente a la DLQ
 *   (Dead-Letter Queue) sin bloquear la cola principal.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderNotificationConsumer {

    @RabbitListener(queues = "${app.rabbitmq.queue.order-notifications}")
    public void consume(OrderCreatedEvent event, Message message, Channel channel) throws Exception {
        long deliveryTag = message.getMessageProperties().getDeliveryTag();
        try {
            if (event.orderId() == null || event.orderId() <= 0) {
                throw new IllegalArgumentException("El ID de la orden es invalido o nulo");
            }
            log.info("[DOMINIO NOTIFICACIONES] Procesando notificacion de orden creada: orderId={}, email={}",
                event.orderId(), event.customerEmail());

            // Simulacion de envio de email exitoso
            // ...
            channel.basicAck(deliveryTag, false);
            log.info("[DOMINIO NOTIFICACIONES] ACK exitoso para la orden {}", event.orderId());
        } catch (Exception exception) {
            log.error("[DOMINIO NOTIFICACIONES] Error al procesar notificacion para orden {}. Desviando a DLQ via basicNack",
                event != null ? event.orderId() : "desconocida", exception);
            // requeue=false activa el enrutamiento x-dead-letter-exchange hacia la DLQ
            channel.basicNack(deliveryTag, false, false);
        }
    }
}