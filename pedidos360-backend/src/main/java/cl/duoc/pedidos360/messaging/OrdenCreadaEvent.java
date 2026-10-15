package cl.duoc.pedidos360.messaging;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrdenCreadaEvent(Long ordenId, BigDecimal total, LocalDateTime fechaCreacion) {
}
