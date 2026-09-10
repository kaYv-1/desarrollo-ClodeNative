package cl.duoc.pedidos360.controller;

import java.util.Map;
import java.util.List;
import java.util.Objects;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(@AuthenticationPrincipal Jwt jwt) {
        List<String> roles = jwt.getClaimAsStringList("roles");
        return ResponseEntity.ok(Map.of(
            "authenticated", true,
            "user", jwt.getSubject(),
            "preferred_username", Objects.toString(jwt.getClaimAsString("preferred_username"), ""),
            "name", Objects.toString(jwt.getClaimAsString("name"), ""),
            "roles", roles == null ? List.of() : roles
        ));
    }

    @GetMapping("/admin-check")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> adminCheck() {
        return ResponseEntity.ok(Map.of("authorized", true, "role", "ADMIN"));
    }
}
