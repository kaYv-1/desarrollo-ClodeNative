package cl.duoc.pedidos360.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.rabbitmq")
public class RabbitMqProperties {

    private String exchangeOrders;
    private QueueProperties queue = new QueueProperties();
    private String routingKeyOrderCreated;
    private String exchangeDeadLetter;

    @Getter
    @Setter
    public static class QueueProperties {
        private String orderNotifications;
        private String orderNotificationsDlq;
    }
}