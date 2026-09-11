package cl.duoc.pedidos360.controller;

import cl.duoc.pedidos360.config.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.beans.factory.annotation.Autowired;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = HealthController.class)
@Import(SecurityConfig.class)
class SecurityMockMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtDecoder jwtDecoder;


    @Test
    void endpointProtegidoRechazaPeticionSinToken() throws Exception {
        mockMvc.perform(get("/api/me"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void endpointAdminRechazaUsuarioSinRol() throws Exception {
        mockMvc.perform(get("/api/admin-check")
                .with(SecurityMockMvcRequestPostProcessors.jwt()))
            .andExpect(status().isForbidden());
    }

    @Test
    void endpointAdminRechazaUsuarioConRolCliente() throws Exception {
        mockMvc.perform(get("/api/admin-check")
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                    .authorities(() -> "ROLE_CLIENTE")))
            .andExpect(status().isForbidden());
    }

    @Test
    void endpointAdminAceptaRolAdmin() throws Exception {
        mockMvc.perform(get("/api/admin-check")
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                    .authorities(() -> "ROLE_ADMIN")))
            .andExpect(status().isOk());
    }

    @Test
    void endpointMeRetornaDetalleUsuarioAutenticado() throws Exception {
        mockMvc.perform(get("/api/me")
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                    .jwt(jwt -> jwt
                        .claim("preferred_username", "estudiante@duoc.cl")
                        .claim("name", "Estudiante Duoc")
                        .claim("roles", java.util.List.of("CLIENTE")))))
            .andExpect(status().isOk());
    }
}