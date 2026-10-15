package cl.duoc.pedidos360.admin.rabbitmq;

import cl.duoc.pedidos360.config.GlobalExceptionHandler;
import cl.duoc.pedidos360.config.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RabbitAdminController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
class RabbitAdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtDecoder jwtDecoder;

    @MockBean
    private RabbitAdminService rabbitAdminService;

    @Test
    void requiereAutenticacionParaAdministrarRabbitMq() throws Exception {
        mockMvc.perform(post("/api/admin/rabbitmq/queues")
                .contentType("application/json")
                .content("{\"name\":\"notificaciones\"}"))
            .andExpect(status().isUnauthorized());

        verifyNoInteractions(rabbitAdminService);
    }

    @Test
    void soloPermiteLaAdministracionAlRolAdmin() throws Exception {
        mockMvc.perform(post("/api/admin/rabbitmq/queues")
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                    .authorities(() -> "ROLE_CLIENTE"))
                .contentType("application/json")
                .content("{\"name\":\"notificaciones\"}"))
            .andExpect(status().isForbidden());

        verifyNoInteractions(rabbitAdminService);
    }

    @Test
    void rechazaNombresDeColaVacios() throws Exception {
        mockMvc.perform(post("/api/admin/rabbitmq/queues")
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                    .authorities(() -> "ROLE_ADMIN"))
                .contentType("application/json")
                .content("{\"name\":\" \"}"))
            .andExpect(status().isBadRequest());

        verifyNoInteractions(rabbitAdminService);
    }
}
