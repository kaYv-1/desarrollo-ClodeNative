package cl.duoc.pedidos360.kafka;

import cl.duoc.pedidos360.config.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(KafkaAdminController.class)
@Import(SecurityConfig.class)
class KafkaAdminSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtDecoder jwtDecoder;

    @MockBean
    private KafkaAdminService kafkaAdminService;

    @Test
    void requiresAuthenticationForAdministration() throws Exception {
        mockMvc.perform(get("/api/admin/kafka/topics"))
            .andExpect(status().isUnauthorized());

        verifyNoInteractions(kafkaAdminService);
    }

    @Test
    void allowsOnlyAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/kafka/topics")
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                    .authorities(() -> "ROLE_CLIENTE")))
            .andExpect(status().isForbidden());

        verifyNoInteractions(kafkaAdminService);
    }

    @Test
    void validatesTopicCreateRequest() throws Exception {
        mockMvc.perform(post("/api/admin/kafka/topics")
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                    .authorities(() -> "ROLE_ADMIN"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":" ","partitions":0,"replicationFactor":0,"retentionMs":0,"cleanupPolicy":"invalid"}
                    """))
            .andExpect(status().isBadRequest());

        verifyNoInteractions(kafkaAdminService);
    }
}
