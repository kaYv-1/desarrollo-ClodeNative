package cl.duoc.pedidos360.runtime;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

import static org.mockito.Mockito.when;

abstract class ApiE2ETestSupport {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @MockBean
    private JwtDecoder jwtDecoder;

    @BeforeEach
    void configureEvaluationTokens() {
        when(jwtDecoder.decode("evaluation-admin"))
            .thenReturn(jwt("evaluation-admin", "ADMIN", "admin@evaluation.test"));
        when(jwtDecoder.decode("evaluation-client"))
            .thenReturn(jwt("evaluation-client", "CLIENTE", "client@evaluation.test"));
    }

    protected <T> ResponseEntity<T> request(
        HttpMethod method,
        String path,
        Object body,
        Class<T> responseType,
        String token
    ) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (token != null) {
            headers.setBearerAuth(token);
        }
        return restTemplate.exchange(
            "http://localhost:" + port + path,
            method,
            new HttpEntity<>(body, headers),
            responseType
        );
    }

    private Jwt jwt(String token, String role, String email) {
        return Jwt.withTokenValue(token)
            .header("alg", "none")
            .claim("roles", List.of(role))
            .claim("preferred_username", email)
            .claim("name", "Evaluation User")
            .build();
    }
}
