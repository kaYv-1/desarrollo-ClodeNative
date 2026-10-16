package cl.duoc.pedidos360.messaging;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.NotBlank;

@ConfigurationProperties(prefix = "app.messaging")
@Validated
public record RabbitMessagingProperties(
    @NotBlank String ordersExchange,
    @NotBlank String deadLetterExchange,
    @NotBlank String notificationsQueue,
    @NotBlank String notificationsDeadLetterQueue,
    @NotBlank String notificationsRoutingKey,
    @NotBlank String notificationsDeadLetterRoutingKey,
    @NotBlank String ticketsQueue,
    @NotBlank String ticketsDeadLetterQueue,
    @NotBlank String ticketsRoutingKey,
    @NotBlank String ticketsDeadLetterRoutingKey,
    @NotBlank String documentsQueue,
    @NotBlank String documentsDeadLetterQueue,
    @NotBlank String documentsRoutingKey,
    @NotBlank String documentsDeadLetterRoutingKey
) {
}
