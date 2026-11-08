import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiService, Producto, Orden, DetallePedido, OrdenParaCrear } from '../../services/api.service';

@Component({
  selector: 'app-cliente-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cliente-portal">
      <div class="page-heading">
        <div>
          <span class="eyebrow">Área personal</span>
          <h1>Tu espacio de compras</h1>
          <p>Explora el catálogo, administra tu carrito y revisa tus órdenes.</p>
        </div>
        <span class="page-icon" aria-hidden="true">🛍️</span>
      </div>

      <div class="tabs">
        <button type="button" class="tab-button" data-tab="productos" (click)="seleccionarTab('productos', $event)" [class.active]="activeTab === 'productos'" [attr.aria-selected]="activeTab === 'productos'">Catálogo</button>
        <button type="button" class="tab-button" data-tab="carrito" (click)="seleccionarTab('carrito', $event)" [class.active]="activeTab === 'carrito'" [attr.aria-selected]="activeTab === 'carrito'">Carrito <span class="tab-count">{{ carrito.length }}</span></button>
        <button type="button" class="tab-button" data-tab="ordenes" (click)="seleccionarTab('ordenes', $event)" [class.active]="activeTab === 'ordenes'" [attr.aria-selected]="activeTab === 'ordenes'">Mis órdenes</button>
      </div>

      <div *ngIf="activeTab === 'productos'" class="tab-content">
        <div class="tab-header">
          <h2>Catálogo de Productos</h2>
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
            {{ producto.stock === 0 ? 'Sin stock' : producto.stock + ' disponibles' }}
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
                    [max]="item.producto.stock"
                    (change)="actualizarCarrito()"
                    [attr.aria-label]="'Cantidad de ' + item.producto.nombre">
                </td>
                <td>\${{ item.precioUnitario }}</td>
                <td>\${{ item.subtotal }}</td>
                <td>
                  <button type="button" class="btn-remove" (click)="eliminarDelCarrito(item)" [attr.aria-label]="'Eliminar ' + item.producto.nombre">Eliminar</button>
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
    .page-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .page-heading h1 {
      margin: 0.2rem 0 0;
      color: #172033;
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(1.7rem, 4vw, 2.5rem);
      letter-spacing: -0.04em;
    }
    .page-heading p {
      margin: 0.5rem 0 0;
      color: #64748b;
    }
    .eyebrow {
      color: #2563eb;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .page-icon {
      display: grid;
      width: 3.5rem;
      height: 3.5rem;
      place-items: center;
      border-radius: 1rem;
      background: #dbeafe;
      font-size: 1.6rem;
    }
    .tabs {
      padding: 0.35rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.9rem;
      background: #fff;
    }
    .tabs button {
      border: 0;
      background: transparent;
      color: #64748b;
      font-weight: 700;
    }
    .tabs button.active {
      background: #2563eb;
      box-shadow: 0 5px 12px rgba(37, 99, 235, 0.22);
    }
    .tab-count {
      display: inline-grid;
      min-width: 1.35rem;
      height: 1.35rem;
      margin-left: 0.25rem;
      padding-inline: 0.25rem;
      place-items: center;
      border-radius: 999px;
      background: rgba(255,255,255,.22);
      font-size: 0.75rem;
    }
    .tab-content {
      border: 1px solid #e2e8f0;
      background: rgba(255,255,255,.88);
      box-shadow: 0 12px 35px rgba(15, 23, 42, .06);
    }
    .producto-card {
      border: 1px solid #e2e8f0;
      border-radius: 0.9rem;
      transition: transform .2s ease, box-shadow .2s ease;
    }
    .producto-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 24px rgba(15, 23, 42, .08);
    }
    .producto-card h3 {
      margin-top: 0;
      color: #172033;
    }
    .add-to-cart, .checkout-btn {
      background: #2563eb;
    }
    .btn-remove {
      border: 0;
      border-radius: 0.45rem;
      background: #fee2e2;
      color: #b91c1c;
      cursor: pointer;
      padding: 0.45rem 0.7rem;
    }
    .tab-content table {
      min-width: 620px;
    }
    @media (max-width: 640px) {
      .cliente-portal { padding: 0; }
      .page-heading { align-items: flex-start; }
      .page-icon { display: none; }
      .tab-header { align-items: flex-start; flex-direction: column; }
      .cart-summary { text-align: left; }
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

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const tab = params.get('tab');
      if (tab === 'carrito' || tab === 'ordenes' || tab === 'productos') {
        this.activeTab = tab;
      }
    });
    this.cargarProductos();
    this.cargarMisOrdenes();
  }

  seleccionarTab(tab: 'productos' | 'carrito' | 'ordenes', event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.activeTab = tab;
    if (tab === 'productos' && !this.cargandoProductos) {
      this.cargarProductos();
    } else if (tab === 'ordenes' && !this.cargandoOrdenes) {
      this.cargarMisOrdenes();
    }
  }

  cargarProductos() {
    if (this.cargandoProductos) {
      return;
    }

    this.cargandoProductos = true;
    this.apiService.obtenerProductosActivos().pipe(
      finalize(() => this.cargandoProductos = false)
    ).subscribe({
      next: (data) => {
        this.productos = data;
      },
      error: () => {
        this.mostrarError('Error cargando productos');
      }
    });
  }

  cargarMisOrdenes() {
    if (this.cargandoOrdenes) {
      return;
    }

    this.cargandoOrdenes = true;
    this.apiService.obtenerTodasLasOrdenes().pipe(
      finalize(() => this.cargandoOrdenes = false)
    ).subscribe({
      next: (data) => {
        this.misOrdenes = data;
      },
      error: () => {
        this.mostrarError('Error al consultar las órdenes');
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
      const cantidad = Number(item.cantidad);
      item.cantidad = Number.isFinite(cantidad)
        ? Math.min(Math.max(Math.trunc(cantidad), 1), item.producto.stock)
        : 1;
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

    const nuevaOrden: OrdenParaCrear = {
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
        const errorMsg = this.obtenerMensajeError(err, 'Error al procesar la orden. Verifique el stock disponible.');
        this.mostrarError(errorMsg);
      }
    });
  }

  private obtenerMensajeError(error: { error?: { message?: string } }, fallback: string): string {
    return error?.error?.message || fallback;
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
