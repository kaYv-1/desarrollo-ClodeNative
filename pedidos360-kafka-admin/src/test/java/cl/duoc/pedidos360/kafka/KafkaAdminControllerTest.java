package cl.duoc.pedidos360.kafka;

import java.util.List;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class KafkaAdminControllerTest {

    @Test
    void listsConsumerGroups() {
        KafkaAdminService service = mock(KafkaAdminService.class);
        KafkaAdminController controller = new KafkaAdminController(service);
        List<KafkaConsumerGroupResponse> groups = List.of(
            new KafkaConsumerGroupResponse("orders-group", "STABLE", 2, List.of("orders.created"))
        );
        when(service.listConsumerGroups()).thenReturn(groups);

        assertEquals(groups, controller.listConsumerGroups());
    }

    @Test
    void deletesConsumerGroup() {
        KafkaAdminService service = mock(KafkaAdminService.class);
        KafkaAdminController controller = new KafkaAdminController(service);

        assertEquals(204, controller.deleteConsumerGroup("orders-group").getStatusCode().value());
        verify(service).deleteConsumerGroup("orders-group");
    }
}
