package cl.duoc.pedidos360.admin.rabbitmq;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ExchangeDefinitionRequest(
    @NotBlank
    @Size(max = 255)
    @Pattern(regexp = "^(?!amq\\.)[A-Za-z0-9][A-Za-z0-9._-]{0,254}$")
    String name,
    @NotNull ExchangeType type,
    Boolean durable,
    Boolean autoDelete
) {
    public ExchangeDefinitionRequest {
        durable = durable == null || durable;
        autoDelete = autoDelete != null && autoDelete;
    }
}
