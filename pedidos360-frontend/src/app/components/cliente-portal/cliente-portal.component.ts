import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Producto, Orden, DetallePedido } from '../../services/api.service';

@Component({
  selector: 'app-cliente-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cliente-portal">
      <h1>Portal de Cliente</h1>

      <div class="tabs">
        <button (click)="seleccionarTab('productos')" [class.active]="activeTab === 'productos'">Catálogo</button>
        <button (click)="seleccionarTab('carrito')" [class.active]="activeTab === 'carrito'">Carrito ({{ carrito.length }})</button>
        <button (click)="seleccionarTab('ordenes')" [class.active]="activeTab === 'ordenes'">Mis Órdenes</button>
      </div>

      <div *ngIf="activeTab === 'productos'" class="tab-content">
        <div class="tab-header">
          <h2>Catálogo de Productos</h2>
          <button type="button" (click)="cargarProductos()" [disabled]="cargandoProductos" class="btn-refresh">
            {{ cargandoProductos ? '🔄 Actualizando...' : '🔄 Refrescar Catálogo' }}
          </button>
        </div>

        <div *ngIf="cargandoProductos && productos.length === 0" class="loading-state">
          Cargando catálogo...
        </div>

        <div *ngIf="!cargandoProductos && productos.length === 0" class="no-productos">
          No hay productos disponibles en este momento.
        </div>

        <div *ngIf="productos.length > 0" class="productos-grid">
          <div *ngFor="let producto of productos" class="producto-card">
            <h3>{{ producto.nombre }}</h3>
            <p>{{ producto.descripcion }}</p>
            <p class="precio">\${{ producto.precio }}</p>
            <p class="stock" [class.sin-stock]="producto.stock === 0">
              Stock: {{ producto.stock }}
            </p>
            <button
              (click)="agregarAlCarrito(producto)"
              [disabled]="producto.stock === 0"
              class="add-to-cart">
              Agregar al Carrito
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="activeTab === 'carrito'" class="tab-content">
        <h2>Carrito de Compras</h2>
        <div *ngIf="carrito.length === 0" class="empty-cart">
          Tu carrito está vacío
        </div>
        <div *ngIf="carrito.length > 0">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Subtotal</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of carrito">
                <td>{{ item.producto.nombre }}</td>
                <td>
                  <input
                    type="number"
                    [(ngModel)]="item.cantidad"
                    min="1"
                    max="{{ item.producto.stock }}"
                    (change)="actualizarCarrito()">
                </td>
                <td>\${{ item.precioUnitario }}</td>
                <td>\${{ item.subtotal }}</td>
                <td>
                  <button (click)="eliminarDelCarrito(item)">Eliminar</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="cart-summary">
            <h3>Total: \${{ calcularTotal() }}</h3>
            <button (click)="procederAlPago()" class="checkout-btn">Proceder al Pago</button>
          </div>
        </div>
      </div>

      <div *ngIf="activeTab === 'ordenes'" class="tab-content">
        <div class="tab-header">
          <h2>Mis Órdenes</h2>
          <button type="button" (click)="cargarMisOrdenes()" [disabled]="cargandoOrdenes" class="btn-refresh">
            {{ cargandoOrdenes ? '🔄 Actualizando...' : '🔄 Refrescar Órdenes' }}
          </button>
        </div>

        <div *ngIf="cargandoOrdenes && misOrdenes.length === 0" class="loading-state">
          Cargando tus órdenes...
        </div>

        <div *ngIf="!cargandoOrdenes && misOrdenes.length === 0" class="no-ordenes">
          No tienes órdenes
        </div>

        <div *ngIf="misOrdenes.length > 0">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let orden of misOrdenes">
                <td>#{{ orden.id }}</td>
                <td>{{ orden.fechaCreacion | date: 'short' }}</td>
                <td class="estado" [class]="orden.estado.toLowerCase()">{{ orden.estado }}</td>
                <td>\${{ orden.total }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="errorMessage" class="error-message">{{ errorMessage }}</div>
      <div *ngIf="successMessage" class="success-message">{{ successMessage }}</div>
    </div>
  `,
  styles: [`
    .cliente-portal {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .tabs {
      display: flex;
      gap: 10px;
      margin: 20px 0;
    }
    .tabs button {
      padding: 10px 20px;
      border: 1px solid #ddd;
      background: #f5f5f5;
      cursor: pointer;
      border-radius: 4px;
    }
    .tabs button.active {
      background: #28a745;
      color: white;
    }
    .tab-content {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 4px;
      margin-top: 20px;
    }
    .productos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .producto-card {
      border: 1px solid #ddd;
      padding: 15px;
      border-radius: 4px;
      background: white;
    }
    .precio {
      font-size: 1.5em;
      color: #28a745;
      font-weight: bold;
    }
    .stock.sin-stock {
      color: #d32f2f;
    }
    .add-to-cart {
      width: 100%;
      padding: 10px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
    }
    .add-to-cart:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .empty-cart, .no-ordenes {
      text-align: center;
      color: #999;
      padding: 40px;
      font-size: 1.1em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    th {
      background: #e9ecef;
      font-weight: bold;
    }
    input[type="number"] {
      width: 60px;
      padding: 5px;
    }
    .cart-summary {
      margin-top: 20px;
      text-align: right;
    }
    .checkout-btn {
      padding: 10px 30px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1em;
    }
    .estado {
      font-weight: bold;
    }
    .estado.pendiente {
      color: #ff9800;
    }
    .estado.procesado {
      color: #2196f3;
    }
    .estado.completado {
      color: #4caf50;
    }
    .estado.cancelado {
      color: #f44336;
    }
    .error-message, .success-message {
      padding: 10px;
      border-radius: 4px;
      margin-top: 20px;
    }
    .error-message {
      color: #d32f2f;
      background: #ffebee;
    }
    .success-message {
      color: #388e3c;
      background: #e8f5e9;
    }
    .tab-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .tab-header h2 {
      margin: 0;
    }
    .btn-refresh {
      background: #ffffff;
      border: 1px solid #28a745;
      color: #28a745;
      font-weight: 600;
      padding: 7px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9em;
      transition: all 0.2s ease;
    }
    .btn-refresh:hover:not(:disabled) {
      background: #28a745;
      color: #ffffff;
    }
    .btn-refresh:disabled {
      cursor: wait;
      opacity: 0.6;
    }
    .loading-state, .no-productos {
      text-align: center;
      color: #666;
      padding: 30px;
      font-size: 1.05em;
    }
  `]
})
export class ClientePortalComponent implements OnInit {

  activeTab: 'productos' | 'carrito' | 'ordenes' = 'productos';
  productos: Producto[] = [];
  misOrdenes: Orden[] = [];
  carrito: DetallePedido[] = [];

  cargandoProductos = false;
  cargandoOrdenes = false;

  errorMessage = '';
  successMessage = '';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.cargarProductos();
    this.cargarMisOrdenes();
  }

  seleccionarTab(tab: 'productos' | 'carrito' | 'ordenes') {
    this.activeTab = tab;
    if (tab === 'productos') {
      this.cargarProductos();
    } else if (tab === 'ordenes') {
      this.cargarMisOrdenes();
    }
  }

  cargarProductos() {
    this.cargandoProductos = true;
    this.apiService.obtenerProductosActivos().subscribe({
      next: (data) => {
        this.productos = data;
        this.cargandoProductos = false;
      },
      error: () => {
        this.mostrarError('Error cargando productos');
        this.cargandoProductos = false;
      }
    });
  }

  cargarMisOrdenes() {
    this.cargandoOrdenes = true;
    this.apiService.obtenerTodasLasOrdenes().subscribe({
      next: (data) => {
        this.misOrdenes = data;
        this.cargandoOrdenes = false;
      },
      error: () => {
        this.mostrarError('Error al consultar las órdenes');
        this.cargandoOrdenes = false;
      }
    });
  }


  agregarAlCarrito(producto: Producto) {
    const itemExistente = this.carrito.find(item => item.producto.id === producto.id);

    if (itemExistente) {
      if (itemExistente.cantidad < (producto.stock || 0)) {
        itemExistente.cantidad++;
      } else {
        this.mostrarError(`Stock máximo alcanzado para ${producto.nombre}`);
        return;
      }
    } else {
      this.carrito.push({
        producto,
        cantidad: 1,
        precioUnitario: producto.precio,
        subtotal: producto.precio
      });
    }

    this.actualizarCarrito();
    this.mostrarExito('Producto agregado al carrito');
  }

  actualizarCarrito() {
    this.carrito.forEach(item => {
      item.subtotal = item.cantidad * item.precioUnitario;
    });
  }

  eliminarDelCarrito(item: DetallePedido) {
    const index = this.carrito.indexOf(item);
    if (index > -1) {
      this.carrito.splice(index, 1);
    }
  }

  calcularTotal(): number {
    return this.carrito.reduce((total, item) => total + item.subtotal, 0);
  }

  procederAlPago() {
    if (this.carrito.length === 0) {
      this.mostrarError('El carrito está vacío');
      return;
    }

    const nuevaOrden: Orden = {
      cliente: {} as any,
      estado: 'PENDIENTE',
      total: this.calcularTotal(),
      detalles: this.carrito.map(item => ({
        producto: { id: item.producto.id } as Producto,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.subtotal
      }))
    };

    this.apiService.crearOrden(nuevaOrden).subscribe({
      next: (ordenCreada) => {
        this.mostrarExito(`¡Orden #${ordenCreada.id} generada exitosamente!`);
        this.carrito = [];
        this.cargarProductos();
        this.cargarMisOrdenes();
        this.activeTab = 'ordenes';
      },
      error: (err) => {
        const errorMsg = err?.error?.message || 'Error al procesar la orden. Verifique el stock disponible.';
        this.mostrarError(errorMsg);
      }
    });
  }

  private mostrarError(mensaje: string) {
    this.errorMessage = mensaje;
    setTimeout(() => this.errorMessage = '', 5000);
  }

  private mostrarExito(mensaje: string) {
    this.successMessage = mensaje;
    setTimeout(() => this.successMessage = '', 5000);
  }
}
