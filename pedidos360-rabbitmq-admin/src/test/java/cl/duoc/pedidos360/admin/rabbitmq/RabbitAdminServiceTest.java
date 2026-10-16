package cl.duoc.pedidos360.admin.rabbitmq;

import cl.duoc.pedidos360.messaging.RabbitMessagingProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;
import static org.mockito.Mockito.lenient;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class RabbitAdminServiceTest {

    @Mock
    private RabbitAdmin rabbitAdmin;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @Mock
    private RabbitMessagingProperties properties;

    @InjectMocks
    private RabbitAdminService service;

    @BeforeEach
    void configurarNombresDeTopologiaInterna() {
        lenient().when(properties.ordersExchange()).thenReturn("pedidos360.orders");
        lenient().when(properties.deadLetterExchange()).thenReturn("pedidos360.dead-letter");
        lenient().when(properties.notificationsQueue()).thenReturn("pedidos360.order-notifications");
        lenient().when(properties.notificationsDeadLetterQueue()).thenReturn("pedidos360.order-notifications.dlq");
        lenient().when(properties.ticketsQueue()).thenReturn("pedidos360.order-tickets");
        lenient().when(properties.ticketsDeadLetterQueue()).thenReturn("pedidos360.order-tickets.dlq");
        lenient().when(properties.documentsQueue()).thenReturn("pedidos360.order-documents");
        lenient().when(properties.documentsDeadLetterQueue()).thenReturn("pedidos360.order-documents.dlq");
    }

    @Test
    void creaUnaColaDurableConValoresPorDefecto() {
        service.createQueue(new QueueDefinitionRequest("reports.ready", null, null, null));

        verify(rabbitAdmin).declareQueue(any(Queue.class));
    }

    @Test
    void impideEliminarLaColaDeMensajesDelSistema() {
        assertThatIllegalArgumentException()
            .isThrownBy(() -> service.deleteQueue("pedidos360.order-tickets.dlq"))
            .withMessageContaining("topología interna");

        verifyNoInteractions(rabbitAdmin);
    }

    @Test
    void rechazaNombresInvalidosAntesDeConsultarRabbitMq() {
        assertThatIllegalArgumentException()
            .isThrownBy(() -> service.deleteExchange(" "));
        assertThatIllegalArgumentException()
            .isThrownBy(() -> service.deleteExchange("amq.reserved"));

        verifyNoInteractions(rabbitAdmin, rabbitTemplate);
    }
}
