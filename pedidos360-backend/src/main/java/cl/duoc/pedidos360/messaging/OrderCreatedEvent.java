package cl.duoc.pedidos360.messaging;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrderCreatedEvent(Long orderId, String customerEmail, BigDecimal total, LocalDateTime createdAt) {
}