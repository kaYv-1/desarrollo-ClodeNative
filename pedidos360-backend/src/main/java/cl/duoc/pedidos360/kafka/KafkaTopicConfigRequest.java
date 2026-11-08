package cl.duoc.pedidos360.kafka;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record KafkaTopicConfigRequest(
    @Min(1) long retentionMs,
    @NotBlank
    @Pattern(regexp = "^(delete|compact|compact,delete|delete,compact)$")
    String cleanupPolicy
) {
}
