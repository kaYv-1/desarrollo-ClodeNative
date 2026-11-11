package cl.duoc.pedidos360.kafka;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "app.kafka")
@Validated
public record KafkaMessagingProperties(
    @NotBlank String orderCreatedTopic,
    @NotBlank String orderNotificationTopic,
    @NotBlank String notificationConsumerGroup,
    @Min(1) int partitions,
    @Min(1) short replicationFactor,
    @Min(1) long retentionMs,
    @NotBlank String cleanupPolicy
) {
}
