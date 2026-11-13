import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiService, Producto, Orden, DetallePedido, OrdenParaCrear, Cliente } from '../../services/api.service';

@Component({
  selector: 'app-cliente-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cliente-portal">
      <!-- Encabezado del Portal -->
      <div class="page-heading">
        <div class="heading-info">
          <span class="eyebrow">Área de Clientes Pedidos360</span>
          <h1>Bienvenido a tu Portal</h1>
          <p>Explora el catálogo de productos cloud, gestiona tu carrito y realiza seguimiento a tus pedidos.</p>
        </div>
        <div class="heading-stats">
          <div class="stat-pill" (click)="seleccionarTab('carrito')">
            <span class="stat-icon">🛒</span>
            <div>
              <span class="stat-value">{{ carrito.length }}</span>
              <span class="stat-label">En Carrito</span>
            </div>
          </div>
          <div class="stat-pill" (click)="seleccionarTab('ordenes')">
            <span class="stat-icon">📦</span>
            <div>
              <span class="stat-value">{{ misOrdenes.length }}</span>
              <span class="stat-label">Órdenes</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Barra de Navegación por Pestañas -->
      <div class="tabs-nav">
        <button type="button" class="tab-btn" [class.active]="activeTab === 'productos'" (click)="seleccionarTab('productos')">
          🛍️ Catálogo de Productos
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab === 'carrito'" (click)="seleccionarTab('carrito')">
          🛒 Mi Carrito <span *ngIf="carrito.length > 0" class="badge-count">{{ carrito.length }}</span>
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab === 'ordenes'" (click)="seleccionarTab('ordenes')">
          📦 Mis Órdenes <span *ngIf="misOrdenes.length > 0" class="badge-count subtle">{{ misOrdenes.length }}</span>
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab === 'perfil'" (click)="seleccionarTab('perfil')">
          👤 Mis Datos de Envío
        </button>
      </div>

      <!-- Notificaciones Toast -->
      <div *ngIf="errorMessage" class="alert-box alert-danger">
        <span>⚠️ {{ errorMessage }}</span>
        <button type="button" class="btn-close" (click)="errorMessage = ''">✕</button>
      </div>
      <div *ngIf="successMessage" class="alert-box alert-success">
        <span>✅ {{ successMessage }}</span>
        <button type="button" class="btn-close" (click)="successMessage = ''">✕</button>
      </div>

      <!-- PESTAÑA 1: CATÁLOGO DE PRODUCTOS -->
      <div *ngIf="activeTab === 'productos'" class="tab-pane">
        <div class="pane-toolbar">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" [(ngModel)]="filtroProducto" placeholder="Buscar por nombre o código SKU..." (input)="filtrarProductos()">
          </div>
          <button type="button" class="btn btn-outline" (click)="cargarProductos()" [disabled]="cargandoProductos">
            {{ cargandoProductos ? '🔄 Actualizando...' : '🔄 Refrescar' }}
          </button>
        </div>

        <div *ngIf="cargandoProductos && productos.length === 0" class="state-card loading">
          <div class="spinner"></div>
          <p>Cargando catálogo de productos...</p>
        </div>

        <div *ngIf="!cargandoProductos && productosFiltrados.length === 0" class="state-card empty">
          <span class="empty-icon">📦</span>
          <h3>No se encontraron productos</h3>
          <p *ngIf="filtroProducto">No hay coincidencias para "{{ filtroProducto }}".</p>
          <p *ngIf="!filtroProducto">No hay productos disponibles en este momento.</p>
        </div>

        <div *ngIf="productosFiltrados.length > 0" class="products-grid">
          <div *ngFor="let producto of productosFiltrados" class="product-card" [class.out-of-stock]="producto.stock === 0">
            <div class="card-badge-row">
              <span class="sku-tag">{{ producto.sku || 'PROD-' + producto.id }}</span>
              <span class="stock-badge" [class.in-stock]="producto.stock > 5" [class.low-stock]="producto.stock > 0 && producto.stock <= 5" [class.no-stock]="producto.stock === 0">
                {{ producto.stock === 0 ? 'Agotado' : (producto.stock <= 5 ? '¡Solo ' + producto.stock + ' disp.!' : producto.stock + ' en stock') }}
              </span>
            </div>
            
            <h3 class="product-title">{{ producto.nombre }}</h3>
            <p class="product-desc">{{ producto.descripcion || 'Sin descripción disponible.' }}</p>
            
            <div class="product-price-row">
              <div class="price-box">
                <small>Precio unitario</small>
                <span class="price-val">\${{ producto.precio | number:'1.0-0' }}</span>
              </div>
            </div>

            <div class="card-actions">
              <div class="qty-selector" *ngIf="producto.stock > 0">
                <button type="button" (click)="ajustarCantidadSelector(producto, -1)">-</button>
                <span>{{ obtenerCantidadSelector(producto) }}</span>
                <button type="button" (click)="ajustarCantidadSelector(producto, 1)" [disabled]="obtenerCantidadSelector(producto) >= producto.stock">+</button>
              </div>
              <button type="button" class="btn btn-primary btn-add" [disabled]="producto.stock === 0" (click)="agregarAlCarritoConCantidad(producto)">
                {{ producto.stock === 0 ? 'Sin Stock' : '🛒 Agregar' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- PESTAÑA 2: CARRITO DE COMPRAS -->
      <div *ngIf="activeTab === 'carrito'" class="tab-pane">
        <div *ngIf="carrito.length === 0" class="state-card empty">
          <span class="empty-icon">🛒</span>
          <h3>Tu carrito de compras está vacío</h3>
          <p>Explora nuestro catálogo para agregar productos y completar tu pedido.</p>
          <button type="button" class="btn btn-primary" (click)="seleccionarTab('productos')">
            Ver Catálogo de Productos
          </button>
        </div>

        <div *ngIf="carrito.length > 0" class="cart-layout">
          <div class="cart-table-card">
            <div class="card-header-clean">
              <h2>Artículos en tu Carrito ({{ carrito.length }})</h2>
              <button type="button" class="btn-text-danger" (click)="vaciarCarrito()">Vaciar carrito</button>
            </div>

            <div class="table-responsive">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio Unitario</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of carrito">
                    <td>
                      <div class="cart-item-info">
                        <strong>{{ item.producto.nombre }}</strong>
                        <small class="text-muted">{{ item.producto.sku || 'SKU: ' + item.producto.id }}</small>
                      </div>
                    </td>
                    <td>\${{ item.precioUnitario | number:'1.0-0' }}</td>
                    <td>
                      <div class="qty-control">
                        <button type="button" (click)="cambiarCantidadCarrito(item, -1)">-</button>
                        <input type="number" [(ngModel)]="item.cantidad" min="1" [max]="item.producto.stock" (change)="actualizarCarrito()">
                        <button type="button" (click)="cambiarCantidadCarrito(item, 1)" [disabled]="item.cantidad >= item.producto.stock">+</button>
                      </div>
                    </td>
                    <td class="font-bold">\${{ item.subtotal | number:'1.0-0' }}</td>
                    <td>
                      <button type="button" class="btn-icon-danger" (click)="eliminarDelCarrito(item)" title="Eliminar artículo">🗑️</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Resumen del Pedido y Datos de Entrega -->
          <div class="cart-sidebar">
            <div class="summary-card">
              <h3>Resumen de la Compra</h3>
              
              <div class="shipping-preview" *ngIf="perfilCliente">
                <div class="preview-header">
                  <span>📍 Dirección de Envío</span>
                  <button type="button" class="link-btn" (click)="seleccionarTab('perfil')">Editar</button>
                </div>
                <p class="shipping-name"><strong>{{ perfilCliente.nombre }}</strong></p>
                <p class="shipping-text">{{ perfilCliente.direccion }}, {{ perfilCliente.ciudad }} ({{ perfilCliente.pais }})</p>
                <p class="shipping-phone">📞 {{ perfilCliente.telefono }}</p>
              </div>

              <div class="summary-row">
                <span>Subtotal</span>
                <span>\${{ calcularTotal() | number:'1.0-0' }}</span>
              </div>
              <div class="summary-row">
                <span>Costo de Envío</span>
                <span class="text-success font-bold">GRATIS</span>
              </div>
              <hr class="summary-divider">
              <div class="summary-total">
                <span>Total a Pagar</span>
                <span class="total-amount">\${{ calcularTotal() | number:'1.0-0' }}</span>
              </div>

              <button type="button" class="btn btn-primary btn-block btn-lg" (click)="procederAlPago()" [disabled]="procesandoOrden">
                {{ procesandoOrden ? '⏳ Procesando Pedido...' : '🚀 Confirmar y Pagar Orden' }}
              </button>
              <small class="text-muted text-center checkout-note">Transacción protegida y auditada con mensajería asíncrona RabbitMQ.</small>
            </div>
          </div>
        </div>
      </div>

      <!-- PESTAÑA 3: MIS ÓRDENES -->
      <div *ngIf="activeTab === 'ordenes'" class="tab-pane">
        <div class="pane-toolbar">
          <h2>Historial de Órdenes</h2>
          <button type="button" class="btn btn-outline" (click)="cargarMisOrdenes()" [disabled]="cargandoOrdenes">
            {{ cargandoOrdenes ? '🔄 Actualizando...' : '🔄 Refrescar Órdenes' }}
          </button>
        </div>

        <div *ngIf="cargandoOrdenes && misOrdenes.length === 0" class="state-card loading">
          <div class="spinner"></div>
          <p>Consultando tus órdenes...</p>
        </div>

        <div *ngIf="!cargandoOrdenes && misOrdenes.length === 0" class="state-card empty">
          <span class="empty-icon">📦</span>
          <h3>Aún no has realizado ninguna compra</h3>
          <p>Cuando realices un pedido, podrás seguir su estado y consultar los detalles aquí.</p>
          <button type="button" class="btn btn-primary" (click)="seleccionarTab('productos')">Explorar Catálogo</button>
        </div>

        <div *ngIf="misOrdenes.length > 0" class="orders-list">
          <div *ngFor="let orden of misOrdenes" class="order-card" [class.selected]="ordenSeleccionada?.id === orden.id">
            <div class="order-card-header">
              <div class="order-meta">
                <span class="order-id">Orden #{{ orden.id }}</span>
                <span class="order-date">{{ orden.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="order-status-wrap">
                <span class="badge-status" [class]="'status-' + orden.estado.toLowerCase()">
                  {{ orden.estado }}
                </span>
                <span class="order-total-badge">\${{ orden.total | number:'1.0-0' }}</span>
              </div>
            </div>

            <!-- Previsualización de ítems -->
            <div class="order-items-preview" *ngIf="orden.detalles && orden.detalles.length > 0">
              <span class="items-count-tag">{{ orden.detalles.length }} producto(s) en este pedido:</span>
              <ul class="items-summary-list">
                <li *ngFor="let d of orden.detalles">
                  <span>{{ d.cantidad }}x {{ d.producto?.nombre || 'Producto #' + d.producto?.id }}</span>
                  <span class="subtotal-item">\${{ d.subtotal | number:'1.0-0' }}</span>
                </li>
              </ul>
            </div>

            <div class="order-card-footer">
              <button type="button" class="btn btn-sm btn-outline" (click)="toggleDetalleOrden(orden)">
                {{ ordenSeleccionada?.id === orden.id ? 'Ocultar Detalle' : '👁️ Ver Detalle Completo' }}
              </button>
              <button *ngIf="orden.estado === 'PENDIENTE'" type="button" class="btn btn-sm btn-danger" (click)="cancelarOrden(orden)" [disabled]="cancelandoOrdenId === orden.id">
                {{ cancelandoOrdenId === orden.id ? 'Cancelando...' : '✕ Cancelar Orden' }}
              </button>
            </div>

            <!-- Panel Expandido de Detalle -->
            <div *ngIf="ordenSeleccionada?.id === orden.id" class="order-expanded-detail">
              <div class="detail-grid">
                <div class="detail-section">
                  <h4>📍 Información de Entrega</h4>
                  <p><strong>Cliente:</strong> {{ orden.cliente?.nombre }}</p>
                  <p><strong>Email:</strong> {{ orden.cliente?.email }}</p>
                  <p><strong>Teléfono:</strong> {{ orden.cliente?.telefono || 'N/A' }}</p>
                  <p><strong>Dirección:</strong> {{ orden.cliente?.direccion }}, {{ orden.cliente?.ciudad }}</p>
                </div>
                <div class="detail-section">
                  <h4>📋 Estado y Trazabilidad</h4>
                  <div class="status-timeline">
                    <div class="timeline-step" [class.step-done]="orden.estado === 'PENDIENTE' || orden.estado === 'PROCESADO' || orden.estado === 'COMPLETADO'">
                      <span class="step-dot">1</span>
                      <small>Pendiente</small>
                    </div>
                    <div class="timeline-line"></div>
                    <div class="timeline-step" [class.step-done]="orden.estado === 'PROCESADO' || orden.estado === 'COMPLETADO'">
                      <span class="step-dot">2</span>
                      <small>Procesado</small>
                    </div>
                    <div class="timeline-line"></div>
                    <div class="timeline-step" [class.step-done]="orden.estado === 'COMPLETADO'">
                      <span class="step-dot">3</span>
                      <small>Completado</small>
                    </div>
                  </div>
                  <p *ngIf="orden.estado === 'CANCELADO'" class="cancel-notice">
                    ⚠️ Esta orden fue <strong>CANCELADA</strong> y el inventario fue restaurado automáticamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PESTAÑA 4: MI PERFIL / DATOS DE ENVÍO -->
      <div *ngIf="activeTab === 'perfil'" class="tab-pane">
        <div class="form-card max-w-xl">
          <div class="card-header-clean">
            <div>
              <h2>Tus Datos de Envío y Contacto</h2>
              <p class="subtitle">Estos datos se asociarán automáticamente a cada orden de compra que realices.</p>
            </div>
          </div>

          <form (ngSubmit)="guardarPerfil()" class="clean-form">
            <div class="form-row">
              <label>Nombre Completo
                <input type="text" [(ngModel)]="perfilCliente.nombre" name="nombre" placeholder="Tu nombre" required>
              </label>
              <label>Correo Electrónico (Azure AD)
                <input type="email" [value]="perfilCliente.email" disabled class="input-disabled" title="El correo proviene de tu sesión de Azure AD">
              </label>
            </div>

            <div class="form-row">
              <label>Teléfono de Contacto
                <input type="text" [(ngModel)]="perfilCliente.telefono" name="telefono" placeholder="+56 9 1234 5678" required>
              </label>
              <label>Código Postal
                <input type="text" [(ngModel)]="perfilCliente.codigoPostal" name="codigoPostal" placeholder="8150000">
              </label>
            </div>

            <label>Dirección de Entrega
              <input type="text" [(ngModel)]="perfilCliente.direccion" name="direccion" placeholder="Calle, Número, Depto/Casa" required>
            </label>

            <div class="form-row">
              <label>Ciudad
                <input type="text" [(ngModel)]="perfilCliente.ciudad" name="ciudad" placeholder="Santiago" required>
              </label>
              <label>País
                <input type="text" [(ngModel)]="perfilCliente.pais" name="pais" placeholder="Chile" required>
              </label>
            </div>

            <div class="form-footer">
              <button type="submit" class="btn btn-primary btn-lg" [disabled]="guardandoPerfil">
                {{ guardandoPerfil ? 'Guardando...' : '💾 Guardar Datos de Envío' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cliente-portal {
      max-width: 1240px;
      margin: 0 auto;
      padding: 1.5rem 1rem 3rem;
    }
    .page-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #fff;
      padding: 2rem 2.5rem;
      border-radius: 1.25rem;
      margin-bottom: 2rem;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2);
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    .eyebrow {
      display: inline-block;
      text-transform: uppercase;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #38bdf8;
      margin-bottom: 0.4rem;
    }
    .heading-info h1 {
      margin: 0 0 0.5rem;
      font-size: 1.85rem;
      letter-spacing: -0.02em;
    }
    .heading-info p {
      margin: 0;
      color: #94a3b8;
      font-size: 0.95rem;
      max-width: 600px;
    }
    .heading-stats {
      display: flex;
      gap: 1rem;
    }
    .stat-pill {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 0.75rem 1.25rem;
      border-radius: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .stat-pill:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
    }
    .stat-icon {
      font-size: 1.6rem;
    }
    .stat-value {
      display: block;
      font-size: 1.3rem;
      font-weight: 800;
      line-height: 1;
    }
    .stat-label {
      font-size: 0.75rem;
      color: #cbd5e1;
      text-transform: uppercase;
    }

    /* Tabs */
    .tabs-nav {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid #e2e8f0;
      margin-bottom: 1.75rem;
      overflow-x: auto;
    }
    .tab-btn {
      background: transparent;
      border: none;
      font-size: 0.95rem;
      font-weight: 600;
      color: #64748b;
      padding: 0.85rem 1.35rem;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      white-space: nowrap;
    }
    .tab-btn:hover {
      color: #0f172a;
    }
    .tab-btn.active {
      color: #0284c7;
      border-bottom-color: #0284c7;
    }
    .badge-count {
      background: #0284c7;
      color: #fff;
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      font-weight: 700;
    }
    .badge-count.subtle {
      background: #e2e8f0;
      color: #334155;
    }

    /* Alerts */
    .alert-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.9rem 1.25rem;
      border-radius: 0.75rem;
      margin-bottom: 1.5rem;
      font-size: 0.95rem;
    }
    .alert-danger {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    .alert-success {
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
    }
    .btn-close {
      background: transparent;
      border: none;
      font-size: 1.1rem;
      cursor: pointer;
      color: inherit;
      opacity: 0.7;
    }
    .btn-close:hover { opacity: 1; }

    /* Toolbar */
    .pane-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .search-box {
      display: flex;
      align-items: center;
      background: #fff;
      border: 1px solid #cbd5e1;
      border-radius: 0.75rem;
      padding: 0.5rem 0.85rem;
      flex: 1;
      max-width: 450px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .search-icon {
      margin-right: 0.5rem;
      opacity: 0.6;
    }
    .search-box input {
      border: none;
      outline: none;
      width: 100%;
      font-size: 0.92rem;
    }

    /* Products Grid */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .product-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      padding: 1.35rem;
      display: flex;
      flex-direction: column;
      box-shadow: 0 2px 5px rgba(0,0,0,0.04);
      transition: all 0.2s ease;
    }
    .product-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 20px -3px rgba(0,0,0,0.08);
      border-color: #cbd5e1;
    }
    .product-card.out-of-stock {
      opacity: 0.75;
      background: #f8fafc;
    }
    .card-badge-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .sku-tag {
      font-size: 0.7rem;
      color: #64748b;
      font-weight: 700;
      background: #f1f5f9;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }
    .stock-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
    }
    .stock-badge.in-stock { background: #dcfce7; color: #15803d; }
    .stock-badge.low-stock { background: #fef9c3; color: #a16207; }
    .stock-badge.no-stock { background: #fee2e2; color: #b91c1c; }
    .product-title {
      margin: 0 0 0.5rem;
      font-size: 1.15rem;
      color: #0f172a;
    }
    .product-desc {
      color: #64748b;
      font-size: 0.88rem;
      line-height: 1.45;
      margin: 0 0 1rem;
      flex-grow: 1;
    }
    .product-price-row {
      margin-bottom: 1rem;
      border-top: 1px dashed #e2e8f0;
      padding-top: 0.75rem;
    }
    .price-box small {
      display: block;
      font-size: 0.72rem;
      color: #94a3b8;
      text-transform: uppercase;
    }
    .price-val {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0284c7;
    }
    .card-actions {
      display: flex;
      gap: 0.5rem;
    }
    .qty-selector {
      display: flex;
      align-items: center;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      overflow: hidden;
      background: #f8fafc;
    }
    .qty-selector button {
      background: transparent;
      border: none;
      padding: 0.4rem 0.7rem;
      font-weight: 700;
      cursor: pointer;
    }
    .qty-selector button:hover { background: #e2e8f0; }
    .qty-selector span {
      padding: 0 0.5rem;
      font-weight: 700;
      min-width: 1.5rem;
      text-align: center;
    }
    .btn-add {
      flex: 1;
    }

    /* Cart Layout */
    .cart-layout {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 1.5rem;
      align-items: start;
    }
    @media (max-width: 900px) {
      .cart-layout { grid-template-columns: 1fr; }
    }
    .cart-table-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      padding: 1.5rem;
    }
    .card-header-clean {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .card-header-clean h2 {
      margin: 0;
      font-size: 1.25rem;
    }
    .btn-text-danger {
      background: transparent;
      border: none;
      color: #ef4444;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-text-danger:hover { text-decoration: underline; }
    .modern-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.92rem;
    }
    .modern-table th {
      text-align: left;
      padding: 0.75rem 0.5rem;
      color: #64748b;
      font-weight: 600;
      border-bottom: 2px solid #e2e8f0;
    }
    .modern-table td {
      padding: 0.85rem 0.5rem;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .cart-item-info strong {
      display: block;
      color: #0f172a;
    }
    .qty-control {
      display: inline-flex;
      align-items: center;
      border: 1px solid #cbd5e1;
      border-radius: 0.4rem;
      overflow: hidden;
    }
    .qty-control button {
      background: #f8fafc;
      border: none;
      padding: 0.3rem 0.6rem;
      cursor: pointer;
      font-weight: 700;
    }
    .qty-control button:hover { background: #e2e8f0; }
    .qty-control input {
      width: 2.75rem;
      text-align: center;
      border: none;
      font-weight: 600;
      outline: none;
    }
    .btn-icon-danger {
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 1.1rem;
      padding: 0.3rem;
      border-radius: 4px;
    }
    .btn-icon-danger:hover { background: #fee2e2; }

    /* Summary Card */
    .summary-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }
    .summary-card h3 {
      margin: 0 0 1.25rem;
      font-size: 1.15rem;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 0.75rem;
    }
    .shipping-preview {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.85rem;
      margin-bottom: 1.25rem;
      font-size: 0.85rem;
    }
    .preview-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.4rem;
      font-weight: 700;
      color: #334155;
    }
    .link-btn {
      background: transparent;
      border: none;
      color: #0284c7;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.8rem;
    }
    .shipping-name { margin: 0 0 0.2rem; color: #0f172a; }
    .shipping-text { margin: 0 0 0.2rem; color: #64748b; }
    .shipping-phone { margin: 0; color: #475569; }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.6rem;
      font-size: 0.92rem;
      color: #475569;
    }
    .summary-divider {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 1rem 0;
    }
    .summary-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 1.25rem;
    }
    .total-amount {
      font-size: 1.45rem;
      color: #0284c7;
      font-weight: 800;
    }
    .checkout-note {
      display: block;
      margin-top: 0.75rem;
      font-size: 0.75rem;
    }

    /* Orders List */
    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .order-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      padding: 1.35rem;
      transition: all 0.2s ease;
    }
    .order-card.selected {
      border-color: #38bdf8;
      box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
    }
    .order-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .order-id {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      margin-right: 0.75rem;
    }
    .order-date {
      color: #64748b;
      font-size: 0.85rem;
    }
    .order-status-wrap {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .badge-status {
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .status-pendiente { background: #fef3c7; color: #b45309; }
    .status-procesado { background: #e0f2fe; color: #0369a1; }
    .status-completado { background: #dcfce7; color: #15803d; }
    .status-cancelado { background: #fee2e2; color: #b91c1c; }
    .order-total-badge {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
    }
    .order-items-preview {
      background: #f8fafc;
      border-radius: 0.65rem;
      padding: 0.75rem 1rem;
      margin-bottom: 1rem;
      font-size: 0.88rem;
    }
    .items-count-tag {
      font-weight: 700;
      color: #475569;
      display: block;
      margin-bottom: 0.4rem;
    }
    .items-summary-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .items-summary-list li {
      display: flex;
      justify-content: space-between;
      padding: 0.2rem 0;
      color: #334155;
    }
    .subtotal-item {
      font-weight: 600;
      color: #64748b;
    }
    .order-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #f1f5f9;
      padding-top: 0.75rem;
    }

    /* Detail Modal / Expansion */
    .order-expanded-detail {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    @media (max-width: 650px) {
      .detail-grid { grid-template-columns: 1fr; }
    }
    .detail-section h4 {
      margin: 0 0 0.75rem;
      font-size: 0.95rem;
      color: #0f172a;
    }
    .detail-section p {
      margin: 0 0 0.35rem;
      font-size: 0.88rem;
      color: #475569;
    }
    .status-timeline {
      display: flex;
      align-items: center;
      margin-top: 0.75rem;
    }
    .timeline-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      opacity: 0.4;
    }
    .timeline-step.step-done {
      opacity: 1;
    }
    .step-dot {
      width: 1.8rem;
      height: 1.8rem;
      border-radius: 50%;
      background: #0284c7;
      color: #fff;
      display: grid;
      place-items: center;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .timeline-line {
      flex: 1;
      height: 3px;
      background: #e2e8f0;
      margin: 0 0.5rem;
      margin-bottom: 1rem;
    }
    .cancel-notice {
      color: #b91c1c;
      font-size: 0.85rem;
      background: #fee2e2;
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      margin-top: 0.75rem;
    }

    /* Form Styles */
    .form-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 4px 15px rgba(0,0,0,0.03);
    }
    .max-w-xl { max-width: 680px; margin: 0 auto; }
    .subtitle { color: #64748b; font-size: 0.9rem; margin-top: 0.25rem; }
    .clean-form label {
      display: block;
      margin-bottom: 1rem;
      font-size: 0.88rem;
      font-weight: 600;
      color: #334155;
    }
    .clean-form input {
      display: block;
      width: 100%;
      margin-top: 0.35rem;
      padding: 0.65rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 0.92rem;
      outline: none;
      box-sizing: border-box;
    }
    .clean-form input:focus {
      border-color: #0284c7;
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
    }
    .input-disabled {
      background: #f8fafc;
      color: #64748b;
      cursor: not-allowed;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 600px) {
      .form-row { grid-template-columns: 1fr; }
    }
    .form-footer {
      margin-top: 1.5rem;
    }

    /* Shared States and Buttons */
    .state-card {
      text-align: center;
      padding: 3.5rem 2rem;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
    }
    .empty-icon { font-size: 3rem; margin-bottom: 0.5rem; display: block; }
    .state-card h3 { margin: 0 0 0.5rem; color: #0f172a; }
    .state-card p { color: #64748b; margin: 0 0 1.25rem; }
    .spinner {
      width: 2.5rem;
      height: 2.5rem;
      border: 3px solid #e2e8f0;
      border-top-color: #0284c7;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .btn {
      padding: 0.6rem 1.25rem;
      font-weight: 600;
      border-radius: 0.5rem;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
      font-size: 0.92rem;
    }
    .btn:hover { opacity: 0.9; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #0284c7; color: #fff; }
    .btn-primary:hover { background: #0369a1; }
    .btn-outline { background: #fff; border: 1px solid #cbd5e1; color: #334155; }
    .btn-outline:hover { background: #f8fafc; border-color: #94a3b8; }
    .btn-danger { background: #ef4444; color: #fff; }
    .btn-danger:hover { background: #dc2626; }
    .btn-sm { padding: 0.35rem 0.75rem; font-size: 0.82rem; }
    .btn-lg { padding: 0.85rem 1.75rem; font-size: 1rem; }
    .btn-block { width: 100%; }
    .font-bold { font-weight: 700; }
    .text-success { color: #16a34a; }
    .text-muted { color: #64748b; }
    .text-center { text-align: center; }
  `]
})
export class ClientePortalComponent implements OnInit {

  activeTab: 'productos' | 'carrito' | 'ordenes' | 'perfil' = 'productos';
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  filtroProducto = '';
  cantidadesSeleccionadas: Record<number, number> = {};

  misOrdenes: Orden[] = [];
  ordenSeleccionada: Orden | null = null;
  cancelandoOrdenId: number | null = null;

  carrito: DetallePedido[] = [];
  cargandoProductos = false;
  cargandoOrdenes = false;
  procesandoOrden = false;

  perfilCliente: Cliente = {
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    pais: 'Chile',
    codigoPostal: ''
  };
  guardandoPerfil = false;

  errorMessage = '';
  successMessage = '';
  private readonly cartStorageKey = 'pedidos360.cart';

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const tab = params.get('tab');
      if (tab === 'carrito' || tab === 'ordenes' || tab === 'productos' || tab === 'perfil') {
        this.activeTab = tab;
      }
    });
    this.cargarCarrito();
    this.cargarProductos();
    this.cargarMisOrdenes();
    this.cargarPerfil();
  }

  seleccionarTab(tab: 'productos' | 'carrito' | 'ordenes' | 'perfil') {
    this.activeTab = tab;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true
    }).catch(error => {
      console.error('No se pudo sincronizar la pestaña del portal:', error);
    });

    if (tab === 'productos' && !this.cargandoProductos) {
      this.cargarProductos();
    } else if (tab === 'ordenes' && !this.cargandoOrdenes) {
      this.cargarMisOrdenes();
    } else if (tab === 'perfil') {
      this.cargarPerfil();
    }
  }

  // --- CATÁLOGO ---
  cargarProductos() {
    if (this.cargandoProductos) return;
    this.cargandoProductos = true;
    this.apiService.obtenerProductosActivos().pipe(
      finalize(() => this.cargandoProductos = false)
    ).subscribe({
      next: (data) => {
        this.productos = data;
        this.filtrarProductos();
      },
      error: () => {
        this.mostrarError('No se pudo cargar el catálogo de productos.');
      }
    });
  }

  filtrarProductos() {
    const q = this.filtroProducto.toLowerCase().trim();
    if (!q) {
      this.productosFiltrados = [...this.productos];
    } else {
      this.productosFiltrados = this.productos.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(q))
      );
    }
  }

  obtenerCantidadSelector(producto: Producto): number {
    return this.cantidadesSeleccionadas[producto.id!] || 1;
  }

  ajustarCantidadSelector(producto: Producto, delta: number) {
    const actual = this.obtenerCantidadSelector(producto);
    const nueva = Math.max(1, Math.min(producto.stock, actual + delta));
    this.cantidadesSeleccionadas[producto.id!] = nueva;
  }

  agregarAlCarritoConCantidad(producto: Producto) {
    const cantidadAAgregar = this.obtenerCantidadSelector(producto);
    const itemExistente = this.carrito.find(item => item.producto.id === producto.id);

    if (itemExistente) {
      if (itemExistente.cantidad + cantidadAAgregar <= (producto.stock || 0)) {
        itemExistente.cantidad += cantidadAAgregar;
      } else {
        this.mostrarError(`Stock máximo alcanzado para ${producto.nombre}. No puedes agregar más.`);
        return;
      }
    } else {
      this.carrito.push({
        producto,
        cantidad: cantidadAAgregar,
        precioUnitario: producto.precio,
        subtotal: producto.precio * cantidadAAgregar
      });
    }

    this.actualizarCarrito();
    this.cantidadesSeleccionadas[producto.id!] = 1;
    this.mostrarExito(`Agregado(s) ${cantidadAAgregar} "${producto.nombre}" al carrito`);
  }

  // --- CARRITO ---
  cambiarCantidadCarrito(item: DetallePedido, delta: number) {
    const nueva = item.cantidad + delta;
    if (nueva <= 0) {
      this.eliminarDelCarrito(item);
    } else if (nueva <= item.producto.stock) {
      item.cantidad = nueva;
      this.actualizarCarrito();
    } else {
      this.mostrarError(`Stock insuficiente. Solo hay ${item.producto.stock} unidades.`);
    }
  }

  actualizarCarrito(persistir = true) {
    this.carrito.forEach(item => {
      const cantidad = Number(item.cantidad);
      item.cantidad = Number.isFinite(cantidad)
        ? Math.min(Math.max(Math.trunc(cantidad), 1), item.producto.stock)
        : 1;
      item.subtotal = item.cantidad * item.precioUnitario;
    });
    if (persistir) {
      this.guardarCarrito();
    }
  }

  eliminarDelCarrito(item: DetallePedido) {
    const index = this.carrito.indexOf(item);
    if (index > -1) {
      this.carrito.splice(index, 1);
      this.guardarCarrito();
      this.mostrarExito(`"${item.producto.nombre}" eliminado del carrito.`);
    }
  }

  vaciarCarrito() {
    this.carrito = [];
    this.guardarCarrito();
    this.mostrarExito('Carrito vaciado.');
  }

  calcularTotal(): number {
    return this.carrito.reduce((total, item) => total + item.subtotal, 0);
  }

  procederAlPago() {
    if (this.carrito.length === 0) {
      this.mostrarError('El carrito está vacío.');
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

    this.procesandoOrden = true;
    this.apiService.crearOrden(nuevaOrden).pipe(
      finalize(() => this.procesandoOrden = false)
    ).subscribe({
      next: (ordenCreada) => {
        this.mostrarExito(`🎉 ¡Orden #${ordenCreada.id} creada con éxito! El evento fue enviado a RabbitMQ.`);
        this.carrito = [];
        this.guardarCarrito();
        this.cargarProductos();
        this.cargarMisOrdenes();
        this.seleccionarTab('ordenes');
      },
      error: (err) => {
        const errorMsg = this.obtenerMensajeError(err, 'Error al procesar la orden. Verifique el stock disponible.');
        this.mostrarError(errorMsg);
      }
    });
  }

  // --- ÓRDENES ---
  cargarMisOrdenes() {
    if (this.cargandoOrdenes) return;
    this.cargandoOrdenes = true;
    this.apiService.obtenerTodasLasOrdenes().pipe(
      finalize(() => this.cargandoOrdenes = false)
    ).subscribe({
      next: (data) => {
        this.misOrdenes = data.sort((a, b) => (b.id || 0) - (a.id || 0));
      },
      error: () => {
        this.mostrarError('Error al consultar el historial de órdenes.');
      }
    });
  }

  toggleDetalleOrden(orden: Orden) {
    if (this.ordenSeleccionada?.id === orden.id) {
      this.ordenSeleccionada = null;
    } else {
      this.ordenSeleccionada = orden;
    }
  }

  cancelarOrden(orden: Orden) {
    if (!confirm(`¿Estás seguro de cancelar la orden #${orden.id}? Los productos serán devueltos al stock.`)) {
      return;
    }

    this.cancelandoOrdenId = orden.id!;
    this.apiService.cancelarOrden(orden.id!).pipe(
      finalize(() => this.cancelandoOrdenId = null)
    ).subscribe({
      next: (ordenCancelada) => {
        this.mostrarExito(`Orden #${orden.id} cancelada. El stock fue restaurado.`);
        orden.estado = 'CANCELADO';
        if (this.ordenSeleccionada && this.ordenSeleccionada.id === orden.id) {
          this.ordenSeleccionada.estado = 'CANCELADO';
        }
        this.cargarProductos();
      },
      error: (err) => {
        this.mostrarError(this.obtenerMensajeError(err, 'No fue posible cancelar la orden.'));
      }
    });
  }

  // --- PERFIL / DATOS DE ENVÍO ---
  cargarPerfil() {
    this.apiService.obtenerMiPerfil().subscribe({
      next: (perfil) => {
        if (perfil) {
          this.perfilCliente = {
            id: perfil.id,
            nombre: perfil.nombre || '',
            email: perfil.email || '',
            telefono: perfil.telefono === 'N/A' ? '' : (perfil.telefono || ''),
            direccion: perfil.direccion === 'N/A' ? '' : (perfil.direccion || ''),
            ciudad: perfil.ciudad === 'N/A' ? '' : (perfil.ciudad || ''),
            pais: perfil.pais || 'Chile',
            codigoPostal: perfil.codigoPostal || ''
          };
        }
      },
      error: () => {
        // En caso de que aún no exista o falle, se mantiene el estado inicial
      }
    });
  }

  guardarPerfil() {
    this.guardandoPerfil = true;
    this.apiService.actualizarMiPerfil(this.perfilCliente).pipe(
      finalize(() => this.guardandoPerfil = false)
    ).subscribe({
      next: (guardado) => {
        this.perfilCliente = guardado;
        this.mostrarExito('Tus datos de envío fueron actualizados exitosamente.');
      },
      error: (err) => {
        this.mostrarError(this.obtenerMensajeError(err, 'No se pudieron guardar los datos de envío.'));
      }
    });
  }

  // --- STORAGE Y HELPERS ---
  private cargarCarrito() {
    const storedCart = sessionStorage.getItem(this.cartStorageKey);
    if (!storedCart) return;
    try {
      const parsedCart: unknown = JSON.parse(storedCart);
      if (Array.isArray(parsedCart)) {
        this.carrito = parsedCart as DetallePedido[];
        this.actualizarCarrito(false);
      }
    } catch {
      sessionStorage.removeItem(this.cartStorageKey);
    }
  }

  private guardarCarrito() {
    sessionStorage.setItem(this.cartStorageKey, JSON.stringify(this.carrito));
  }

  private obtenerMensajeError(error: { error?: { message?: string } }, fallback: string): string {
    return error?.error?.message || fallback;
  }

  private mostrarError(mensaje: string) {
    this.errorMessage = mensaje;
    setTimeout(() => this.errorMessage = '', 6000);
  }

  private mostrarExito(mensaje: string) {
    this.successMessage = mensaje;
    setTimeout(() => this.successMessage = '', 6000);
  }
}
