package cl.duoc.pedidos360.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Propiedades centralizadas de configuracion para la topologia de RabbitMQ.
 * Mapea el prefijo 'app.rabbitmq' desde application.properties.
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "app.rabbitmq")
public class RabbitMqProperties {

    private String exchangeOrders;
    private String exchangeDeadLetter;
    private String routingKeyOrderCreated;
    private String routingKeyDeadLetter;
    private String routingKeyDeadLetterTickets;

    private QueueProperties queue = new QueueProperties();

    @Getter
    @Setter
    public static class QueueProperties {
        private String orderNotifications;
        private String orderNotificationsDlq;
        private String orderTickets;
        private String orderTicketsDlq;
    }
}