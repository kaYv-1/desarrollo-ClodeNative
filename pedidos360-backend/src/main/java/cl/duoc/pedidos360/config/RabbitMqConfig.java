package cl.duoc.pedidos360.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

/**
 * Configuracion centralizada de la topologia de mensajeria RabbitMQ.
 * Declara de manera declarativa los Exchanges (Topic y Direct DLX), Queues (principales y DLQ)
 * y los Bindings correspondientes para los distintos casos de uso del sistema:
 * 1. Dominio de Notificaciones al Cliente.
 * 2. Dominio de Generacion Asincrona de Tickets y Documentos de Pedido.
 */
@Configuration
@EnableConfigurationProperties(RabbitMqProperties.class)
public class RabbitMqConfig {

    /**
     * Convertidor de mensajes a formato JSON usando Jackson.
     * Permite la serializacion y deserializacion automatica de eventos de dominio.
     */
    @Bean
    public MessageConverter rabbitMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    /**
     * Exchange principal de eventos de negocio tipo Topic.
     * Permite el enrutamiento desacoplado basado en patrones de routing key (ej. 'order.created').
     */
    @Bean
    public TopicExchange ordersExchange(RabbitMqProperties properties) {
        return new TopicExchange(properties.getExchangeOrders(), true, false);
    }

    /**
     * Dead-Letter Exchange (DLX) tipo Direct.
     * Recibe los mensajes rechazados (NACK con requeue=false) de todas las colas de negocio.
     */
    @Bean
    public DirectExchange deadLetterExchange(RabbitMqProperties properties) {
        return new DirectExchange(properties.getExchangeDeadLetter(), true, false);
    }

    // =========================================================================
    // CASO DE USO 1: NOTIFICACIONES DE PEDIDOS (EMAIL / ALERTA)
    // =========================================================================

    /**
     * Cola Dead-Letter Queue (DLQ) para notificaciones fallidas que agotaron su procesamiento.
     */
    @Bean
    public Queue orderNotificationsDlq(RabbitMqProperties properties) {
        return new Queue(properties.getQueue().getOrderNotificationsDlq(), true);
    }

    /**
     * Cola principal de notificaciones de pedidos.
     * Configurada con argumentos x-dead-letter-exchange y x-dead-letter-routing-key
     * para desviar mensajes no procesables a la DLQ.
     */
    @Bean
    public Queue orderNotificationsQueue(RabbitMqProperties properties) {
        return new Queue(
            properties.getQueue().getOrderNotifications(),
            true,
            false,
            false,
            Map.of(
                "x-dead-letter-exchange", properties.getExchangeDeadLetter(),
                "x-dead-letter-routing-key", properties.getRoutingKeyDeadLetter()
            )
        );
    }

    /**
     * Enlace entre el exchange principal de ordenes y la cola de notificaciones.
     */
    @Bean
    public Binding orderNotificationsBinding(Queue orderNotificationsQueue,
                                            TopicExchange ordersExchange,
                                            RabbitMqProperties properties) {
        return BindingBuilder.bind(orderNotificationsQueue)
            .to(ordersExchange)
            .with(properties.getRoutingKeyOrderCreated());
    }

    /**
     * Enlace entre la DLQ de notificaciones y el Dead-Letter Exchange.
     */
    @Bean
    public Binding orderNotificationsDlqBinding(Queue orderNotificationsDlq,
                                               DirectExchange deadLetterExchange,
                                               RabbitMqProperties properties) {
        return BindingBuilder.bind(orderNotificationsDlq)
            .to(deadLetterExchange)
            .with(properties.getRoutingKeyDeadLetter());
    }

    // =========================================================================
    // CASO DE USO 2: GENERACION DE TICKETS Y DOCUMENTOS (FACTURACION / RECIBOS)
    // =========================================================================

    /**
     * Cola Dead-Letter Queue (DLQ) para generacion de tickets fallida.
     */
    @Bean
    public Queue orderTicketsDlq(RabbitMqProperties properties) {
        return new Queue(properties.getQueue().getOrderTicketsDlq(), true);
    }

    /**
     * Cola principal de generacion de tickets de pedidos.
     * Tambien configurada con su propio routing a la DLQ de tickets.
     */
    @Bean
    public Queue orderTicketsQueue(RabbitMqProperties properties) {
        return new Queue(
            properties.getQueue().getOrderTickets(),
            true,
            false,
            false,
            Map.of(
                "x-dead-letter-exchange", properties.getExchangeDeadLetter(),
                "x-dead-letter-routing-key", properties.getRoutingKeyDeadLetterTickets()
            )
        );
    }

    /**
     * Enlace entre el exchange de ordenes y la cola de tickets.
     * Se activa concurrentemente al crearse una orden sin acoplarse a notificaciones.
     */
    @Bean
    public Binding orderTicketsBinding(Queue orderTicketsQueue,
                                       TopicExchange ordersExchange,
                                       RabbitMqProperties properties) {
        return BindingBuilder.bind(orderTicketsQueue)
            .to(ordersExchange)
            .with(properties.getRoutingKeyOrderCreated());
    }

    /**
     * Enlace entre la DLQ de tickets y el Dead-Letter Exchange.
     */
    @Bean
    public Binding orderTicketsDlqBinding(Queue orderTicketsDlq,
                                          DirectExchange deadLetterExchange,
                                          RabbitMqProperties properties) {
        return BindingBuilder.bind(orderTicketsDlq)
            .to(deadLetterExchange)
            .with(properties.getRoutingKeyDeadLetterTickets());
    }
}