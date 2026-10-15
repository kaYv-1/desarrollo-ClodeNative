package cl.duoc.pedidos360.controller;

import cl.duoc.pedidos360.config.SecurityConfig;
import cl.duoc.pedidos360.messaging.RabbitAdminService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = RabbitAdminController.class)
@Import(SecurityConfig.class)
class RabbitAdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RabbitAdminService rabbitAdminService;

    @MockBean
    private JwtDecoder jwtDecoder;

    @Test
    void crearColaExitosoConRolAdmin() throws Exception {
        RabbitAdminController.QueueRequest request =
            new RabbitAdminController.QueueRequest("pedidos360.test-queue", true);

        mockMvc.perform(post("/api/admin/rabbitmq/queues")
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                    .authorities(() -> "ROLE_ADMIN"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk());

        verify(rabbitAdminService).createQueue("pedidos360.test-queue", true);
    }

    @Test
    void rechazaCreacionDeColaConNombreVacioValidacionDTO() throws Exception {
        RabbitAdminController.QueueRequest request =
            new RabbitAdminController.QueueRequest("", true);

        mockMvc.perform(post("/api/admin/rabbitmq/queues")
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                    .authorities(() -> "ROLE_ADMIN"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void rechazaCreacionDeExchangeConTipoInvalido() throws Exception {
        RabbitAdminController.ExchangeRequest request =
            new RabbitAdminController.ExchangeRequest("pedidos360.custom-exchange", "invalido", true);

        mockMvc.perform(post("/api/admin/rabbitmq/exchanges")
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                    .authorities(() -> "ROLE_ADMIN"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void eliminarColaExitosoConRolAdmin() throws Exception {
        mockMvc.perform(delete("/api/admin/rabbitmq/queues/cola-antigua")
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                    .authorities(() -> "ROLE_ADMIN")))
            .andExpect(status().isNoContent());

        verify(rabbitAdminService).deleteQueue("cola-antigua");
    }

    @Test
    void rechazaAccesoAEndPointAdminSinAutenticacion() throws Exception {
        RabbitAdminController.QueueRequest request =
            new RabbitAdminController.QueueRequest("nueva-cola", true);

        mockMvc.perform(post("/api/admin/rabbitmq/queues")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void rechazaAccesoAEndPointAdminParaRolCliente() throws Exception {
        RabbitAdminController.QueueRequest request =
            new RabbitAdminController.QueueRequest("nueva-cola", true);

        mockMvc.perform(post("/api/admin/rabbitmq/queues")
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                    .authorities(() -> "ROLE_CLIENTE"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isForbidden());
    }
}
