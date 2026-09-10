package cl.duoc.pedidos360.config;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class AzureJwtAuthenticationConverterTest {

    private final AzureJwtAuthenticationConverter converter = new AzureJwtAuthenticationConverter();

    @Test
    void convierteRolesAzureEnAutoridadesSpring() {
        Jwt jwt = jwtWithRoles(List.of("ADMIN", "CLIENTE"));

        var authentication = converter.convert(jwt);

        assertThat(authentication.getAuthorities())
            .extracting("authority")
            .containsExactlyInAnyOrder("ROLE_ADMIN", "ROLE_CLIENTE");
    }

    @Test
    void noDuplicaPrefijoRole() {
        Jwt jwt = jwtWithRoles(List.of("ROLE_ADMIN"));

        var authentication = converter.convert(jwt);

        assertThat(authentication.getAuthorities())
            .extracting("authority")
            .containsExactly("ROLE_ADMIN");
    }

    @Test
    void claimAusenteNoGeneraAutoridades() {
        Jwt jwt = new Jwt("token", Instant.EPOCH, Instant.MAX, Map.of("alg", "none"), Map.of("sub", "user"));

        assertThat(converter.convert(jwt).getAuthorities()).isEmpty();
    }

    private Jwt jwtWithRoles(List<String> roles) {
        return new Jwt(
            "token",
            Instant.EPOCH,
            Instant.MAX,
            Map.of("alg", "none"),
            Map.of("roles", roles, "preferred_username", "angel@example.com"));
    }
}