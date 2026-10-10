package cl.duoc.pedidos360.controller;

import cl.duoc.pedidos360.messaging.RabbitAdminService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/rabbitmq")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class RabbitAdminController {

    private final RabbitAdminService rabbitAdminService;

    @PostMapping("/queues")
    public ResponseEntity<Void> createQueue(@Valid @RequestBody QueueRequest request) {
        rabbitAdminService.createQueue(request.name(), request.durable());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/queues/{name}")
    public ResponseEntity<Void> deleteQueue(@PathVariable String name) {
        rabbitAdminService.deleteQueue(name);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/exchanges")
    public ResponseEntity<Void> createExchange(@Valid @RequestBody ExchangeRequest request) {
        rabbitAdminService.createExchange(request.name(), request.type(), request.durable());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/exchanges/{name}")
    public ResponseEntity<Void> deleteExchange(@PathVariable String name) {
        rabbitAdminService.deleteExchange(name);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bindings")
    public ResponseEntity<Void> createBinding(@Valid @RequestBody BindingRequest request) {
        rabbitAdminService.createBinding(request.queue(), request.exchange(), request.routingKey());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/bindings")
    public ResponseEntity<Void> deleteBinding(@Valid @RequestBody BindingRequest request) {
        rabbitAdminService.deleteBinding(request.queue(), request.exchange(), request.routingKey());
        return ResponseEntity.noContent().build();
    }

    public record QueueRequest(@NotBlank String name, boolean durable) { }

    public record ExchangeRequest(
        @NotBlank String name,
        @Pattern(regexp = "(?i)direct|topic", message = "type debe ser direct o topic") String type,
        boolean durable) { }

    public record BindingRequest(
        @NotBlank String queue,
        @NotBlank String exchange,
        @NotBlank String routingKey) { }
}