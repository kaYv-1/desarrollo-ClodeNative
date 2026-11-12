package cl.duoc.pedidos360.runtime;

import java.math.BigDecimal;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import cl.duoc.pedidos360.Pedidos360BackendApplication;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest(classes = Pedidos360BackendApplication.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("h2")
@TestPropertySource(properties = {
    "spring.rabbitmq.host=localhost",
    "spring.rabbitmq.port=5672",
    "spring.rabbitmq.username=pedidos360",
    "spring.rabbitmq.password=pedidos360-local",
    "spring.kafka.listener.auto-startup=false",
    "spring.kafka.admin.auto-create=false"
})
class OrdenApiE2ETest extends ApiE2ETestSupport {

    @Test
    void createsAnOrderPersistsItAndDecrementsProductStock() {
        String sku = "ORDER-EVAL-" + UUID.randomUUID();
        JsonNode product = JsonNodeFactory.instance.objectNode()
            .put("nombre", "Producto para orden")
            .put("descripcion", "Flujo de compra de evaluación")
            .put("precio", new BigDecimal("7500.00"))
            .put("stock", 5)
            .put("sku", sku)
            .put("activo", true);
        ResponseEntity<JsonNode> productCreated = request(
            HttpMethod.POST, "/api/productos", product, JsonNode.class, "evaluation-admin");
        assertEquals(HttpStatus.CREATED, productCreated.getStatusCode());
        long productId = productCreated.getBody().get("id").asLong();

        ObjectNode orderRequest = JsonNodeFactory.instance.objectNode();
        ObjectNode detail = orderRequest.putArray("detalles").addObject();
        detail.putObject("producto").put("id", productId);
        detail.put("cantidad", 2);

        assertEquals(HttpStatus.UNAUTHORIZED,
            request(HttpMethod.POST, "/api/ordenes", orderRequest, JsonNode.class, null).getStatusCode());

        ResponseEntity<JsonNode> createdOrder = request(
            HttpMethod.POST, "/api/ordenes", orderRequest, JsonNode.class, "evaluation-client");
        assertEquals(HttpStatus.CREATED, createdOrder.getStatusCode());
        assertNotNull(createdOrder.getBody());
        long orderId = createdOrder.getBody().get("id").asLong();
        long clientId = createdOrder.getBody().get("cliente").get("id").asLong();
        assertEquals(0, new BigDecimal("15000.00").compareTo(createdOrder.getBody().get("total").decimalValue()));

        ResponseEntity<JsonNode> persistedOrder = request(
            HttpMethod.GET, "/api/ordenes/" + orderId, null, JsonNode.class, "evaluation-client");
        assertEquals(HttpStatus.OK, persistedOrder.getStatusCode());
        assertEquals("PENDIENTE", persistedOrder.getBody().get("estado").asText());
        assertEquals(1, persistedOrder.getBody().get("detalles").size());
        assertEquals(orderId, persistedOrder.getBody().get("id").asLong());

        ResponseEntity<JsonNode> persistedProduct = request(
            HttpMethod.GET, "/api/productos/" + productId, null, JsonNode.class, "evaluation-admin");
        assertEquals(3, persistedProduct.getBody().get("stock").asInt());

        assertEquals(HttpStatus.NO_CONTENT,
            request(HttpMethod.DELETE, "/api/ordenes/" + orderId, null, Void.class, "evaluation-admin")
                .getStatusCode());
        request(HttpMethod.DELETE, "/api/clientes/" + clientId, null, Void.class, "evaluation-admin");
        request(HttpMethod.DELETE, "/api/productos/" + productId, null, Void.class, "evaluation-admin");
    }
}
