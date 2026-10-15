package cl.duoc.pedidos360;

import cl.duoc.pedidos360.messaging.RabbitMessagingProperties;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class RabbitMqAdminApplicationTests {

    @Autowired
    private RabbitMessagingProperties properties;

    @Test
    void cargaLaConfiguracionDeLaTopologiaProtegida() {
        assertThat(properties.orderCreatedQueue()).isEqualTo("pedidos360.orders.notifications");
        assertThat(properties.deadLetterQueue()).isEqualTo("pedidos360.orders.notifications.dlq");
    }
}
