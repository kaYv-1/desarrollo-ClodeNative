package cl.duoc.pedidos360.admin.rabbitmq;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/rabbitmq")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Validated
public class RabbitAdminController {

    private static final String RESOURCE_NAME_PATTERN = "^(?!amq\\.)[A-Za-z0-9][A-Za-z0-9._-]{0,254}$";

    private final RabbitAdminService rabbitAdminService;

    @PostMapping("/queues")
    public ResponseEntity<Void> createQueue(@Valid @RequestBody QueueDefinitionRequest request) {
        rabbitAdminService.createQueue(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/queues/{name}")
    public ResponseEntity<Void> deleteQueue(
        @PathVariable
        @NotBlank
        @Pattern(regexp = RESOURCE_NAME_PATTERN)
        String name
    ) {
        rabbitAdminService.deleteQueue(name);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/exchanges")
    public ResponseEntity<Void> createExchange(@Valid @RequestBody ExchangeDefinitionRequest request) {
        rabbitAdminService.createExchange(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/exchanges/{name}")
    public ResponseEntity<Void> deleteExchange(
        @PathVariable
        @NotBlank
        @Pattern(regexp = RESOURCE_NAME_PATTERN)
        String name
    ) {
        rabbitAdminService.deleteExchange(name);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bindings")
    public ResponseEntity<Void> createBinding(@Valid @RequestBody BindingDefinitionRequest request) {
        rabbitAdminService.createBinding(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/bindings")
    public ResponseEntity<Void> deleteBinding(
        @RequestParam @NotBlank @Pattern(regexp = RESOURCE_NAME_PATTERN) String queueName,
        @RequestParam @NotBlank @Pattern(regexp = RESOURCE_NAME_PATTERN) String exchangeName,
        @RequestParam(required = false) @Size(max = 255) String routingKey
    ) {
        rabbitAdminService.deleteBinding(
            new BindingDefinitionRequest(queueName, exchangeName, routingKey)
        );
        return ResponseEntity.noContent().build();
    }
}
