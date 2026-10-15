package cl.duoc.pedidos360.admin.rabbitmq;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record QueueDefinitionRequest(
    @NotBlank
    @Size(max = 255)
    @Pattern(regexp = "^(?!amq\\.)[A-Za-z0-9][A-Za-z0-9._-]{0,254}$")
    String name,
    Boolean durable,
    Boolean exclusive,
    Boolean autoDelete
) {
    public QueueDefinitionRequest {
        durable = durable == null || durable;
        exclusive = exclusive != null && exclusive;
        autoDelete = autoDelete != null && autoDelete;
    }
}
