package cl.duoc.pedidos360.service;

import cl.duoc.pedidos360.model.DetallePedido;
import cl.duoc.pedidos360.model.Orden;
import cl.duoc.pedidos360.model.Orden.EstadoOrden;
import cl.duoc.pedidos360.model.Producto;
import cl.duoc.pedidos360.repository.OrdenRepository;
import cl.duoc.pedidos360.repository.DetallePedidoRepository;
import cl.duoc.pedidos360.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OrdenService {

    private final OrdenRepository ordenRepository;
    private final DetallePedidoRepository detallePedidoRepository;
    private final ProductoRepository productoRepository;

    @Transactional
    public Orden crearOrden(Orden orden) {
        orden.setFechaCreacion(LocalDateTime.now());
        orden.setEstado(EstadoOrden.PENDIENTE);
        prepararDetalles(orden);
        calcularTotalOrden(orden);
        return ordenRepository.save(orden);
    }

    public Optional<Orden> obtenerOrdenPorId(Long id) {
        return ordenRepository.findById(id);
    }

    public List<Orden> obtenerTodasLasOrdenes() {
        return ordenRepository.findAll();
    }

    public List<Orden> obtenerOrdenesPorCliente(Long clienteId) {
        return ordenRepository.findByClienteId(clienteId);
    }

    public List<Orden> obtenerOrdenesPorEmailCliente(String email) {
        return ordenRepository.findByClienteEmail(email);
    }

    public Optional<Orden> obtenerOrdenPorIdYEmailCliente(Long id, String email) {
        return ordenRepository.findByIdAndClienteEmail(id, email);
    }

    public List<Orden> obtenerOrdenesPorEstado(EstadoOrden estado) {
        return ordenRepository.findByEstado(estado);
    }

    @Transactional
    public Orden agregarDetalleAOrden(Long ordenId, DetallePedido detalle) {
        Orden orden = ordenRepository.findById(ordenId)
            .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada"));
        
        detalle.setOrden(orden);
        prepararDetalle(detalle);
        
        orden.getDetalles().add(detalle);
        calcularTotalOrden(orden);
        return ordenRepository.save(orden);
    }

    public Orden cambiarEstadoOrden(Long ordenId, EstadoOrden nuevoEstado) {
        Orden orden = ordenRepository.findById(ordenId)
            .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada"));
        
        orden.setEstado(nuevoEstado);
        orden.setFechaActualizacion(LocalDateTime.now());
        return ordenRepository.save(orden);
    }

    public void eliminarOrden(Long id) {
        ordenRepository.deleteById(id);
    }

    private void calcularTotalOrden(Orden orden) {
        BigDecimal total = orden.getDetalles().stream()
            .map(DetallePedido::getSubtotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        orden.setTotal(total);
    }

    private void prepararDetalles(Orden orden) {
        if (orden.getDetalles() == null || orden.getDetalles().isEmpty()) {
            throw new IllegalArgumentException("La orden debe contener al menos un producto");
        }

        orden.getDetalles().forEach(detalle -> {
            detalle.setOrden(orden);
            prepararDetalle(detalle);
        });
    }

    private void prepararDetalle(DetallePedido detalle) {
        if (detalle.getProducto() == null || detalle.getProducto().getId() == null) {
            throw new IllegalArgumentException("Cada detalle debe indicar un producto válido");
        }
        if (detalle.getCantidad() == null || detalle.getCantidad() <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor que cero");
        }

        Producto producto = productoRepository.findById(detalle.getProducto().getId())
            .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado"));
        if (!Boolean.TRUE.equals(producto.getActivo())) {
            throw new IllegalArgumentException("El producto no está disponible");
        }
        if (producto.getStock() < detalle.getCantidad()) {
            throw new IllegalArgumentException("Stock insuficiente para el producto " + producto.getNombre());
        }

        producto.setStock(producto.getStock() - detalle.getCantidad());
        productoRepository.save(producto);
        detalle.setProducto(producto);
        detalle.setPrecioUnitario(producto.getPrecio());
        detalle.calcularSubtotal();
    }
}
