package cl.duoc.pedidos360.service;

import cl.duoc.pedidos360.model.DetallePedido;
import cl.duoc.pedidos360.model.Orden;
import cl.duoc.pedidos360.model.Producto;
import cl.duoc.pedidos360.repository.DetallePedidoRepository;
import cl.duoc.pedidos360.repository.OrdenRepository;
import cl.duoc.pedidos360.repository.ProductoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrdenServiceTest {

    @Mock
    private OrdenRepository ordenRepository;

    @Mock
    private DetallePedidoRepository detallePedidoRepository;

    @Mock
    private ProductoRepository productoRepository;

    @InjectMocks
    private OrdenService ordenService;

    @Test
    void crearOrdenUsaPrecioRealDescuentaStockYCalculaTotal() {
        Producto producto = new Producto();
        producto.setId(10L);
        producto.setNombre("Teclado");
        producto.setPrecio(new BigDecimal("12500.00"));
        producto.setStock(5);
        producto.setActivo(true);

        DetallePedido detalle = new DetallePedido();
        detalle.setProducto(producto);
        detalle.setCantidad(2);

        Orden orden = new Orden();
        orden.getDetalles().add(detalle);

        when(productoRepository.findById(10L)).thenReturn(Optional.of(producto));
        when(ordenRepository.save(any(Orden.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Orden resultado = ordenService.crearOrden(orden);

        assertThat(resultado.getEstado()).isEqualTo(Orden.EstadoOrden.PENDIENTE);
        assertThat(resultado.getTotal()).isEqualByComparingTo("25000.00");
        assertThat(resultado.getDetalles().get(0).getPrecioUnitario()).isEqualByComparingTo("12500.00");
        assertThat(producto.getStock()).isEqualTo(3);
    }

    @Test
    void crearOrdenRechazaStockInsuficiente() {
        Producto producto = new Producto();
        producto.setId(10L);
        producto.setNombre("Teclado");
        producto.setPrecio(new BigDecimal("12500.00"));
        producto.setStock(1);
        producto.setActivo(true);

        DetallePedido detalle = new DetallePedido();
        detalle.setProducto(producto);
        detalle.setCantidad(2);

        Orden orden = new Orden();
        orden.getDetalles().add(detalle);

        when(productoRepository.findById(10L)).thenReturn(Optional.of(producto));

        assertThatIllegalArgumentException()
            .isThrownBy(() -> ordenService.crearOrden(orden))
            .withMessageContaining("Stock insuficiente");
    }
}