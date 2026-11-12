package cl.duoc.pedidos360.runtime;

import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
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
class ClienteApiE2ETest extends ApiE2ETestSupport {

    @Test
    void createsReadsUpdatesAndDeletesAClientWithAdminAuthorization() {
        String email = "evaluation-" + UUID.randomUUID() + "@example.test";
        JsonNode newClient = client("Estudiante de evaluación", email, "Santiago");

        assertEquals(HttpStatus.UNAUTHORIZED,
            request(HttpMethod.POST, "/api/clientes", newClient, JsonNode.class, null).getStatusCode());
        assertEquals(HttpStatus.FORBIDDEN,
            request(HttpMethod.POST, "/api/clientes", newClient, JsonNode.class, "evaluation-client")
                .getStatusCode());

        ResponseEntity<JsonNode> created = request(
            HttpMethod.POST, "/api/clientes", newClient, JsonNode.class, "evaluation-admin");
        assertEquals(HttpStatus.CREATED, created.getStatusCode());
        assertNotNull(created.getBody());
        long id = created.getBody().get("id").asLong();

        ResponseEntity<JsonNode> persisted = request(
            HttpMethod.GET, "/api/clientes/" + id, null, JsonNode.class, "evaluation-admin");
        assertEquals(HttpStatus.OK, persisted.getStatusCode());
        assertEquals(email, persisted.getBody().get("email").asText());

        JsonNode updatedClient = client("Estudiante actualizado", email, "Valparaíso");
        ResponseEntity<JsonNode> updated = request(
            HttpMethod.PUT, "/api/clientes/" + id, updatedClient, JsonNode.class, "evaluation-admin");
        assertEquals(HttpStatus.OK, updated.getStatusCode());
        assertEquals("Valparaíso", updated.getBody().get("ciudad").asText());

        assertEquals(HttpStatus.NO_CONTENT,
            request(HttpMethod.DELETE, "/api/clientes/" + id, null, Void.class, "evaluation-admin").getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND,
            request(HttpMethod.GET, "/api/clientes/" + id, null, JsonNode.class, "evaluation-admin").getStatusCode());
    }

    private JsonNode client(String name, String email, String city) {
        return JsonNodeFactory.instance.objectNode()
            .put("nombre", name)
            .put("email", email)
            .put("telefono", "+56912345678")
            .put("direccion", "Av. de prueba 123")
            .put("ciudad", city)
            .put("pais", "Chile")
            .put("codigoPostal", "8320000");
    }
}
