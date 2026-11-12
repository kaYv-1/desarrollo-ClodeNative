package cl.duoc.pedidos360.runtime;

import java.math.BigDecimal;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
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
class ProductoApiE2ETest extends ApiE2ETestSupport {

    @Test
    void createsReadsUpdatesAndDeletesAProductAndRejectsAnonymousWrites() {
        String sku = "EVAL-" + UUID.randomUUID();
        JsonNode newProduct = product("Producto de evaluación", sku, "12990.00", 12);

        assertEquals(HttpStatus.UNAUTHORIZED,
            request(HttpMethod.POST, "/api/productos", newProduct, JsonNode.class, null).getStatusCode());

        ResponseEntity<JsonNode> created = request(
            HttpMethod.POST, "/api/productos", newProduct, JsonNode.class, "evaluation-admin");
        assertEquals(HttpStatus.CREATED, created.getStatusCode());
        assertNotNull(created.getBody());
        long id = created.getBody().get("id").asLong();

        ResponseEntity<JsonNode> persisted = request(
            HttpMethod.GET, "/api/productos/" + id, null, JsonNode.class, "evaluation-admin");
        assertEquals(HttpStatus.OK, persisted.getStatusCode());
        assertEquals(sku, persisted.getBody().get("sku").asText());
        assertEquals(0, new BigDecimal("12990.00").compareTo(persisted.getBody().get("precio").decimalValue()));

        JsonNode updatedProduct = product("Producto actualizado", sku, "14990.00", 8);
        ResponseEntity<JsonNode> updated = request(
            HttpMethod.PUT, "/api/productos/" + id, updatedProduct, JsonNode.class, "evaluation-admin");
        assertEquals(HttpStatus.OK, updated.getStatusCode());
        assertEquals(8, updated.getBody().get("stock").asInt());

        assertEquals(HttpStatus.NO_CONTENT,
            request(HttpMethod.DELETE, "/api/productos/" + id, null, Void.class, "evaluation-admin").getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND,
            request(HttpMethod.GET, "/api/productos/" + id, null, JsonNode.class, "evaluation-admin").getStatusCode());
    }

    private JsonNode product(String name, String sku, String price, int stock) {
        return com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode()
            .put("nombre", name)
            .put("descripcion", "Producto creado por prueba de evaluación")
            .put("precio", new BigDecimal(price))
            .put("stock", stock)
            .put("sku", sku)
            .put("activo", true);
    }
}
