package cl.duoc.pedidos360.messaging;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.NotBlank;

@ConfigurationProperties(prefix = "app.messaging")
@Validated
public record RabbitMessagingProperties(
    @NotBlank String orderCreatedExchange,
    @NotBlank String orderCreatedQueue,
    @NotBlank String orderCreatedRoutingKey,
    @NotBlank String deadLetterExchange,
    @NotBlank String deadLetterQueue,
    @NotBlank String deadLetterRoutingKey
) {
}
