package cl.duoc.pedidos360.kafka;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record KafkaTopicCreateRequest(
    @NotBlank
    @Pattern(regexp = "^[A-Za-z0-9._-]{1,249}$")
    String name,
    @Min(1) int partitions,
    @Min(1) short replicationFactor,
    @Min(1) long retentionMs,
    @NotBlank
    @Pattern(regexp = "^(delete|compact|compact,delete|delete,compact)$")
    String cleanupPolicy
) {
}
