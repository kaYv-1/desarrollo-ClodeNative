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
        assertThat(properties.notificationsQueue()).isEqualTo("pedidos360.order-notifications");
        assertThat(properties.ticketsQueue()).isEqualTo("pedidos360.order-tickets");
        assertThat(properties.documentsQueue()).isEqualTo("pedidos360.order-documents");
        assertThat(properties.notificationsDeadLetterQueue()).isEqualTo("pedidos360.order-notifications.dlq");
        assertThat(properties.ticketsDeadLetterQueue()).isEqualTo("pedidos360.order-tickets.dlq");
        assertThat(properties.documentsDeadLetterQueue()).isEqualTo("pedidos360.order-documents.dlq");
    }
}
