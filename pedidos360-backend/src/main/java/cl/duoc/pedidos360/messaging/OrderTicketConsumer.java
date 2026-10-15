package cl.duoc.pedidos360.messaging;

import com.rabbitmq.client.Channel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Consumidor asincrono del dominio de Facturacion y Generacion de Tickets.
 * Genera el documento de comprobante digital cuando una orden es creada.
 *
 * Politica de Confirmacion:
 * - Modo manual (AcknowledgeMode.MANUAL).
 * - Exito: Confirma el mensaje con basicAck.
 * - Error: Envia basicNack con requeue=false desviando el mensaje a la DLQ de tickets
 *   registrando el incidente en logs estructurados.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderTicketConsumer {

    @RabbitListener(queues = "${app.rabbitmq.queue.order-tickets}")
    public void consume(OrderCreatedEvent event, Message message, Channel channel) throws Exception {
        long deliveryTag = message.getMessageProperties().getDeliveryTag();
        try {
            if (event.total() == null || event.orderId() == null) {
                throw new IllegalArgumentException("Datos incompletos para generar el ticket digital");
            }
            log.info("[DOMINIO TICKETS] Generando ticket digital para orden: id={}, total=${}",
                event.orderId(), event.total());

            // Simulacion de generacion de ticket/PDF de orden
            // ...
            channel.basicAck(deliveryTag, false);
            log.info("[DOMINIO TICKETS] Ticket generado y ACK confirmado para la orden {}", event.orderId());
        } catch (Exception exception) {
            log.error("[DOMINIO TICKETS] Fallo en emision de ticket para orden {}. Enviando a DLQ via basicNack",
                event != null ? event.orderId() : "desconocida", exception);
            // requeue=false activa el enrutamiento x-dead-letter-exchange hacia la DLQ de tickets
            channel.basicNack(deliveryTag, false, false);
        }
    }
}
