package cl.duoc.pedidos360;

import cl.duoc.pedidos360.messaging.RabbitMessagingProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(RabbitMessagingProperties.class)
public class RabbitMqAdminApplication {

    public static void main(String[] args) {
        SpringApplication.run(RabbitMqAdminApplication.class, args);
    }
}
