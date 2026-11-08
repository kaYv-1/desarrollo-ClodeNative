package cl.duoc.pedidos360.kafka;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/kafka/topics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Validated
public class KafkaAdminController {

    private static final String TOPIC_NAME_PATTERN = "^[A-Za-z0-9._-]{1,249}$";

    private final KafkaAdminService kafkaAdminService;

    @PostMapping
    public ResponseEntity<Void> create(@Valid @RequestBody KafkaTopicCreateRequest request) {
        kafkaAdminService.createTopic(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping
    public List<KafkaTopicResponse> list() {
        return kafkaAdminService.listTopics();
    }

    @GetMapping("/{name}")
    public KafkaTopicResponse get(
        @PathVariable @NotBlank @Pattern(regexp = TOPIC_NAME_PATTERN) String name
    ) {
        return kafkaAdminService.getTopic(name);
    }

    @PutMapping("/{name}/config")
    public ResponseEntity<Void> updateConfig(
        @PathVariable @NotBlank @Pattern(regexp = TOPIC_NAME_PATTERN) String name,
        @Valid @RequestBody KafkaTopicConfigRequest request
    ) {
        kafkaAdminService.updateTopicConfig(name, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{name}")
    public ResponseEntity<Void> delete(
        @PathVariable @NotBlank @Pattern(regexp = TOPIC_NAME_PATTERN) String name
    ) {
        kafkaAdminService.deleteTopic(name);
        return ResponseEntity.noContent().build();
    }
}
