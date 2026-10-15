package cl.duoc.pedidos360.admin.rabbitmq;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record BindingDefinitionRequest(
    @NotBlank
    @Size(max = 255)
    @Pattern(regexp = "^(?!amq\\.)[A-Za-z0-9][A-Za-z0-9._-]{0,254}$")
    String queueName,
    @NotBlank
    @Size(max = 255)
    @Pattern(regexp = "^(?!amq\\.)[A-Za-z0-9][A-Za-z0-9._-]{0,254}$")
    String exchangeName,
    @Size(max = 255)
    String routingKey
) {
    public BindingDefinitionRequest {
        routingKey = routingKey == null ? "" : routingKey;
    }
}
