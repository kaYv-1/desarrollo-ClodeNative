import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService, Cliente, Producto, Orden } from '../../services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-dashboard">
      <!-- Encabezado del Panel -->
      <div class="page-heading">
        <div class="heading-info">
          <span class="eyebrow">Módulo de Administración Oficial</span>
          <h1>Panel de Control Operativo</h1>
          <p>Supervisa órdenes de compra, administra el catálogo de productos y gestiona la base de clientes.</p>
        </div>
        <div class="admin-badge-pill">
          <span>🛡️ Modo Administrador Activo</span>
        </div>
      </div>

      <!-- Tarjetas de Métricas KPI -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon icon-revenue">💰</div>
          <div class="kpi-data">
            <span class="kpi-value">\${{ calcularTotalVentas() | number:'1.0-0' }}</span>
            <span class="kpi-label">Ventas Totales</span>
          </div>
        </div>

        <div class="kpi-card" (click)="seleccionarTab('ordenes')">
          <div class="kpi-icon icon-orders">📦</div>
          <div class="kpi-data">
            <span class="kpi-value">{{ ordenes.length }}</span>
            <span class="kpi-label">Órdenes ({{ contarOrdenesPendientes() }} pendientes)</span>
          </div>
        </div>

        <div class="kpi-card" (click)="seleccionarTab('productos')">
          <div class="kpi-icon icon-products">🏷️</div>
          <div class="kpi-data">
            <span class="kpi-value">{{ productos.length }}</span>
            <span class="kpi-label">Productos ({{ contarBajoStock() }} con bajo stock)</span>
          </div>
        </div>

        <div class="kpi-card" (click)="seleccionarTab('clientes')">
          <div class="kpi-icon icon-clients">👥</div>
          <div class="kpi-data">
            <span class="kpi-value">{{ clientes.length }}</span>
            <span class="kpi-label">Clientes Registrados</span>
          </div>
        </div>
      </div>

      <!-- Pestañas de Gestión -->
      <div class="tabs-nav">
        <button type="button" class="tab-btn" [class.active]="activeTab === 'ordenes'" (click)="seleccionarTab('ordenes')">
          📦 Gestión de Órdenes <span class="badge-count">{{ ordenes.length }}</span>
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab === 'productos'" (click)="seleccionarTab('productos')">
          🏷️ Catálogo de Productos <span class="badge-count">{{ productos.length }}</span>
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab === 'clientes'" (click)="seleccionarTab('clientes')">
          👥 Base de Clientes <span class="badge-count">{{ clientes.length }}</span>
        </button>
      </div>

      <!-- Notificaciones -->
      <div *ngIf="errorMessage" class="alert-box alert-danger">
        <span>⚠️ {{ errorMessage }}</span>
        <button type="button" class="btn-close" (click)="errorMessage = ''">✕</button>
      </div>
      <div *ngIf="successMessage" class="alert-box alert-success">
        <span>✅ {{ successMessage }}</span>
        <button type="button" class="btn-close" (click)="successMessage = ''">✕</button>
      </div>

      <!-- ========================================== -->
      <!-- PESTAÑA 1: GESTIÓN DE ÓRDENES             -->
      <!-- ========================================== -->
      <div *ngIf="activeTab === 'ordenes'" class="tab-pane">
        <div class="pane-toolbar">
          <div class="toolbar-left">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input type="text" [(ngModel)]="busquedaOrden" placeholder="Buscar por ID de orden o cliente..." (input)="filtrarOrdenes()">
            </div>
            <div class="filter-pills">
              <button type="button" class="pill-btn" [class.active]="filtroEstadoOrden === 'TODOS'" (click)="setFiltroEstado('TODOS')">Todas ({{ ordenes.length }})</button>
              <button type="button" class="pill-btn" [class.active]="filtroEstadoOrden === 'PENDIENTE'" (click)="setFiltroEstado('PENDIENTE')">Pendientes</button>
              <button type="button" class="pill-btn" [class.active]="filtroEstadoOrden === 'PROCESADO'" (click)="setFiltroEstado('PROCESADO')">Procesadas</button>
              <button type="button" class="pill-btn" [class.active]="filtroEstadoOrden === 'COMPLETADO'" (click)="setFiltroEstado('COMPLETADO')">Completadas</button>
              <button type="button" class="pill-btn" [class.active]="filtroEstadoOrden === 'CANCELADO'" (click)="setFiltroEstado('CANCELADO')">Canceladas</button>
            </div>
          </div>
          <button type="button" class="btn btn-outline" (click)="cargarOrdenes()" [disabled]="cargandoOrdenes">
            {{ cargandoOrdenes ? '🔄 Actualizando...' : '🔄 Refrescar' }}
          </button>
        </div>

        <div *ngIf="cargandoOrdenes && ordenes.length === 0" class="state-card loading">
          <div class="spinner"></div>
          <p>Cargando órdenes de compra...</p>
        </div>

        <div *ngIf="!cargandoOrdenes && ordenesFiltradas.length === 0" class="state-card empty">
          <p>No se encontraron órdenes con los criterios especificados.</p>
        </div>

        <div *ngIf="ordenesFiltradas.length > 0" class="table-card">
          <table class="modern-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado Actual</th>
                <th>Cambiar Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let orden of ordenesFiltradas">
                <td><strong>#{{ orden.id }}</strong></td>
                <td>{{ orden.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}</td>
                <td>
                  <div class="client-meta">
                    <strong>{{ orden.cliente?.nombre || 'Cliente sin nombre' }}</strong>
                    <small class="text-muted">{{ orden.cliente?.email }}</small>
                  </div>
                </td>
                <td class="font-bold">\${{ orden.total | number:'1.0-0' }}</td>
                <td>
                  <span class="badge-status" [class]="'status-' + orden.estado.toLowerCase()">
                    {{ orden.estado }}
                  </span>
                </td>
                <td>
                  <select class="status-select" [value]="orden.estado" (change)="cambiarEstado(orden, $event)">
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="PROCESADO">Procesado</option>
                    <option value="COMPLETADO">Completado</option>
                    <option value="CANCELADO">Cancelado (Restaura Stock)</option>
                  </select>
                </td>
                <td>
                  <div class="row-actions">
                    <button type="button" class="btn btn-sm btn-outline" (click)="abrirModalOrden(orden)">
                      👁️ Detalle
                    </button>
                    <button type="button" class="btn-icon-danger" (click)="eliminarOrden(orden.id!)" title="Eliminar orden">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- PESTAÑA 2: GESTIÓN DE PRODUCTOS            -->
      <!-- ========================================== -->
      <div *ngIf="activeTab === 'productos'" class="tab-pane">
        <div class="pane-toolbar">
          <div class="toolbar-left">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input type="text" [(ngModel)]="busquedaProducto" placeholder="Buscar por nombre o código SKU..." (input)="filtrarProductos()">
            </div>
            <button type="button" class="btn btn-primary" (click)="abrirModalNuevoProducto()">
              ➕ Nuevo Producto
            </button>
          </div>
          <button type="button" class="btn btn-outline" (click)="cargarProductos()" [disabled]="cargandoProductos">
            {{ cargandoProductos ? '🔄 Actualizando...' : '🔄 Refrescar' }}
          </button>
        </div>

        <div *ngIf="cargandoProductos && productos.length === 0" class="state-card loading">
          <div class="spinner"></div>
          <p>Cargando catálogo...</p>
        </div>

        <div *ngIf="!cargandoProductos && productosFiltrados.length === 0" class="state-card empty">
          <p>No se encontraron productos.</p>
        </div>

        <div *ngIf="productosFiltrados.length > 0" class="table-card">
          <table class="modern-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>SKU</th>
                <th>Nombre y Descripción</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of productosFiltrados">
                <td>#{{ p.id }}</td>
                <td><span class="sku-tag">{{ p.sku || 'N/A' }}</span></td>
                <td>
                  <div class="product-info-cell">
                    <strong>{{ p.nombre }}</strong>
                    <small class="text-muted line-clamp">{{ p.descripcion || 'Sin descripción' }}</small>
                  </div>
                </td>
                <td class="font-bold">\${{ p.precio | number:'1.0-0' }}</td>
                <td>
                  <span class="stock-pill" [class.stock-zero]="p.stock === 0" [class.stock-warn]="p.stock > 0 && p.stock <= 5" [class.stock-ok]="p.stock > 5">
                    {{ p.stock }} unid.
                  </span>
                </td>
                <td>
                  <span class="status-pill" [class.pill-active]="p.activo" [class.pill-inactive]="!p.activo">
                    {{ p.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td>
                  <div class="row-actions">
                    <button type="button" class="btn btn-sm btn-outline" (click)="abrirModalEditarProducto(p)" title="Editar producto">
                      ✏️ Editar
                    </button>
                    <button type="button" class="btn btn-sm" [class.btn-outline]="p.activo" [class.btn-success-light]="!p.activo" (click)="toggleActivoProducto(p)">
                      {{ p.activo ? 'Desactivar' : 'Activar' }}
                    </button>
                    <button type="button" class="btn-icon-danger" (click)="eliminarProducto(p.id!)" title="Eliminar producto">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- PESTAÑA 3: GESTIÓN DE CLIENTES             -->
      <!-- ========================================== -->
      <div *ngIf="activeTab === 'clientes'" class="tab-pane">
        <div class="pane-toolbar">
          <div class="toolbar-left">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input type="text" [(ngModel)]="busquedaCliente" placeholder="Buscar cliente por nombre o email..." (input)="filtrarClientes()">
            </div>
            <button type="button" class="btn btn-primary" (click)="abrirModalNuevoCliente()">
              ➕ Registrar Cliente
            </button>
          </div>
          <button type="button" class="btn btn-outline" (click)="cargarClientes()" [disabled]="cargandoClientes">
            {{ cargandoClientes ? '🔄 Actualizando...' : '🔄 Refrescar' }}
          </button>
        </div>

        <div *ngIf="cargandoClientes && clientes.length === 0" class="state-card loading">
          <div class="spinner"></div>
          <p>Cargando base de clientes...</p>
        </div>

        <div *ngIf="!cargandoClientes && clientesFiltrados.length === 0" class="state-card empty">
          <p>No se encontraron clientes.</p>
        </div>

        <div *ngIf="clientesFiltrados.length > 0" class="table-card">
          <table class="modern-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Dirección y Ciudad</th>
                <th>País</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of clientesFiltrados">
                <td>#{{ c.id }}</td>
                <td><strong>{{ c.nombre }}</strong></td>
                <td>{{ c.email }}</td>
                <td>{{ c.telefono || 'N/A' }}</td>
                <td>{{ c.direccion || 'N/A' }}, {{ c.ciudad || 'N/A' }}</td>
                <td>{{ c.pais || 'Chile' }}</td>
                <td>
                  <div class="row-actions">
                    <button type="button" class="btn btn-sm btn-outline" (click)="abrirModalEditarCliente(c)">
                      ✏️ Editar
                    </button>
                    <button type="button" class="btn-icon-danger" (click)="eliminarCliente(c.id!)" title="Eliminar cliente">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MODAL: DETALLE DE ORDEN                    -->
      <!-- ========================================== -->
      <div *ngIf="ordenModal" class="modal-backdrop" (click)="ordenModal = null">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Detalle Completo - Orden #{{ ordenModal.id }}</h3>
            <button type="button" class="modal-close" (click)="ordenModal = null">✕</button>
          </div>
          <div class="modal-body">
            <div class="modal-meta-row">
              <div>
                <strong>Fecha:</strong> {{ ordenModal.fechaCreacion | date:'dd/MM/yyyy HH:mm:ss' }}
              </div>
              <div>
                <strong>Estado:</strong>
                <span class="badge-status" [class]="'status-' + ordenModal.estado.toLowerCase()">
                  {{ ordenModal.estado }}
                </span>
              </div>
            </div>

            <div class="modal-section">
              <h4>👤 Información del Comprador</h4>
              <p><strong>Nombre:</strong> {{ ordenModal.cliente?.nombre }}</p>
              <p><strong>Email:</strong> {{ ordenModal.cliente?.email }}</p>
              <p><strong>Teléfono:</strong> {{ ordenModal.cliente?.telefono || 'N/A' }}</p>
              <p><strong>Dirección de Entrega:</strong> {{ ordenModal.cliente?.direccion }}, {{ ordenModal.cliente?.ciudad }} ({{ ordenModal.cliente?.pais }})</p>
            </div>

            <div class="modal-section">
              <h4>📦 Artículos en el Pedido</h4>
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio Unit.</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let det of ordenModal.detalles">
                    <td>
                      <strong>{{ det.producto?.nombre || 'Producto #' + det.producto?.id }}</strong>
                      <small class="text-muted" *ngIf="det.producto?.sku">({{ det.producto?.sku }})</small>
                    </td>
                    <td>\${{ det.precioUnitario | number:'1.0-0' }}</td>
                    <td>{{ det.cantidad }}</td>
                    <td class="font-bold">\${{ det.subtotal | number:'1.0-0' }}</td>
                  </tr>
                </tbody>
              </table>
              <div class="modal-total-row">
                <span>Total de la Orden:</span>
                <span class="modal-total-val">\${{ ordenModal.total | number:'1.0-0' }}</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" (click)="ordenModal = null">Cerrar</button>
          </div>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MODAL: FORMULARIO PRODUCTO (CREAR / EDITAR)-->
      <!-- ========================================== -->
      <div *ngIf="modalProductoAbierto" class="modal-backdrop" (click)="modalProductoAbierto = false">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ productoEnEdicion.id ? 'Editar Producto #' + productoEnEdicion.id : 'Registrar Nuevo Producto' }}</h3>
            <button type="button" class="modal-close" (click)="modalProductoAbierto = false">✕</button>
          </div>
          <form (ngSubmit)="guardarProducto()" class="modal-form">
            <div class="modal-body">
              <div class="form-row">
                <label>Nombre del Producto *
                  <input type="text" [(ngModel)]="productoEnEdicion.nombre" name="nombre" placeholder="ej. Servidor Cloud Pro" required>
                </label>
                <label>Código SKU
                  <input type="text" [(ngModel)]="productoEnEdicion.sku" name="sku" placeholder="ej. CLD-001">
                </label>
              </div>

              <div class="form-row">
                <label>Precio Unitario ($ CLP) *
                  <input type="number" [(ngModel)]="productoEnEdicion.precio" name="precio" min="0" required>
                </label>
                <label>Stock Disponible *
                  <input type="number" [(ngModel)]="productoEnEdicion.stock" name="stock" min="0" required>
                </label>
              </div>

              <label>Descripción
                <textarea [(ngModel)]="productoEnEdicion.descripcion" name="descripcion" rows="3" placeholder="Descripción detallada del producto..."></textarea>
              </label>

              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="productoEnEdicion.activo" name="activo">
                <span>Producto Activo para la venta en el catálogo</span>
              </label>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" (click)="modalProductoAbierto = false">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="guardandoProducto">
                {{ guardandoProducto ? 'Guardando...' : '💾 Guardar Producto' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MODAL: FORMULARIO CLIENTE (CREAR / EDITAR) -->
      <!-- ========================================== -->
      <div *ngIf="modalClienteAbierto" class="modal-backdrop" (click)="modalClienteAbierto = false">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ clienteEnEdicion.id ? 'Editar Cliente #' + clienteEnEdicion.id : 'Registrar Nuevo Cliente' }}</h3>
            <button type="button" class="modal-close" (click)="modalClienteAbierto = false">✕</button>
          </div>
          <form (ngSubmit)="guardarCliente()" class="modal-form">
            <div class="modal-body">
              <div class="form-row">
                <label>Nombre Completo *
                  <input type="text" [(ngModel)]="clienteEnEdicion.nombre" name="nombre" placeholder="Nombre y Apellidos" required>
                </label>
                <label>Email *
                  <input type="email" [(ngModel)]="clienteEnEdicion.email" name="email" placeholder="usuario@ejemplo.com" required>
                </label>
              </div>

              <div class="form-row">
                <label>Teléfono *
                  <input type="text" [(ngModel)]="clienteEnEdicion.telefono" name="telefono" placeholder="+56 9..." required>
                </label>
                <label>Código Postal
                  <input type="text" [(ngModel)]="clienteEnEdicion.codigoPostal" name="codigoPostal" placeholder="8150000">
                </label>
              </div>

              <label>Dirección *
                <input type="text" [(ngModel)]="clienteEnEdicion.direccion" name="direccion" placeholder="Calle, Número" required>
              </label>

              <div class="form-row">
                <label>Ciudad *
                  <input type="text" [(ngModel)]="clienteEnEdicion.ciudad" name="ciudad" placeholder="Santiago" required>
                </label>
                <label>País *
                  <input type="text" [(ngModel)]="clienteEnEdicion.pais" name="pais" placeholder="Chile" required>
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" (click)="modalClienteAbierto = false">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="guardandoCliente">
                {{ guardandoCliente ? 'Guardando...' : '💾 Guardar Cliente' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard {
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
      margin-bottom: 1.75rem;
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
      color: #f59e0b;
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
      max-width: 650px;
    }
    .admin-badge-pill {
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #fbbf24;
      padding: 0.6rem 1.2rem;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.85rem;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .kpi-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 18px rgba(0,0,0,0.06);
      border-color: #cbd5e1;
    }
    .kpi-icon {
      font-size: 1.8rem;
      width: 3rem;
      height: 3rem;
      border-radius: 0.75rem;
      display: grid;
      place-items: center;
    }
    .icon-revenue { background: #dcfce7; color: #166534; }
    .icon-orders { background: #e0f2fe; color: #0369a1; }
    .icon-products { background: #fef3c7; color: #b45309; }
    .icon-clients { background: #f3e8ff; color: #6b21a8; }
    .kpi-value {
      display: block;
      font-size: 1.45rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }
    .kpi-label {
      font-size: 0.78rem;
      color: #64748b;
      font-weight: 600;
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
    .tab-btn:hover { color: #0f172a; }
    .tab-btn.active {
      color: #0284c7;
      border-bottom-color: #0284c7;
    }
    .badge-count {
      background: #e2e8f0;
      color: #334155;
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      font-weight: 700;
    }
    .tab-btn.active .badge-count {
      background: #0284c7;
      color: #fff;
    }

    /* Toolbar */
    .pane-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      flex: 1;
    }
    .search-box {
      display: flex;
      align-items: center;
      background: #fff;
      border: 1px solid #cbd5e1;
      border-radius: 0.65rem;
      padding: 0.5rem 0.85rem;
      min-width: 280px;
    }
    .search-icon { margin-right: 0.5rem; opacity: 0.6; }
    .search-box input {
      border: none;
      outline: none;
      width: 100%;
      font-size: 0.9rem;
    }
    .filter-pills {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }
    .pill-btn {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 999px;
      padding: 0.35rem 0.75rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .pill-btn:hover { background: #e2e8f0; }
    .pill-btn.active {
      background: #0284c7;
      color: #fff;
      border-color: #0284c7;
    }

    /* Modern Table */
    .table-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      overflow-x: auto;
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
    }
    .modern-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
      min-width: 780px;
    }
    .modern-table th {
      text-align: left;
      padding: 0.9rem 1rem;
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
      border-bottom: 2px solid #e2e8f0;
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .modern-table td {
      padding: 0.9rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
      color: #1e293b;
    }
    .modern-table tr:hover td {
      background: #fbfdff;
    }
    .client-meta strong, .product-info-cell strong {
      display: block;
      color: #0f172a;
    }
    .line-clamp {
      display: block;
      max-width: 320px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .status-select {
      padding: 0.35rem 0.6rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.45rem;
      font-size: 0.85rem;
      background: #f8fafc;
      outline: none;
      cursor: pointer;
    }
    .status-select:focus { border-color: #0284c7; }
    .row-actions {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .btn-icon-danger {
      background: transparent;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      padding: 0.3rem 0.5rem;
      border-radius: 0.4rem;
    }
    .btn-icon-danger:hover { background: #fee2e2; }

    /* Badges */
    .sku-tag {
      font-size: 0.72rem;
      font-weight: 700;
      background: #f1f5f9;
      color: #475569;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }
    .badge-status {
      padding: 0.25rem 0.65rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
    }
    .status-pendiente { background: #fef3c7; color: #b45309; }
    .status-procesado { background: #e0f2fe; color: #0369a1; }
    .status-completado { background: #dcfce7; color: #15803d; }
    .status-cancelado { background: #fee2e2; color: #b91c1c; }

    .stock-pill {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 700;
    }
    .stock-ok { background: #dcfce7; color: #15803d; }
    .stock-warn { background: #fef9c3; color: #a16207; }
    .stock-zero { background: #fee2e2; color: #b91c1c; }

    .status-pill {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .pill-active { background: #e0e7ff; color: #3730a3; }
    .pill-inactive { background: #f1f5f9; color: #64748b; }

    /* Modals */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      display: grid;
      place-items: center;
      z-index: 1000;
      padding: 1rem;
    }
    .modal-card {
      background: #fff;
      border-radius: 1.25rem;
      width: 100%;
      max-width: 650px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .modal-header h3 { margin: 0; font-size: 1.2rem; }
    .modal-close {
      background: transparent;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: #64748b;
    }
    .modal-body {
      padding: 1.5rem;
    }
    .modal-meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1.25rem;
      font-size: 0.9rem;
    }
    .modal-section {
      margin-bottom: 1.5rem;
    }
    .modal-section h4 {
      margin: 0 0 0.5rem;
      font-size: 0.95rem;
      color: #0f172a;
    }
    .modal-section p {
      margin: 0 0 0.25rem;
      font-size: 0.88rem;
      color: #475569;
    }
    .modal-total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 2px solid #e2e8f0;
      font-size: 1.05rem;
      font-weight: 700;
    }
    .modal-total-val {
      font-size: 1.35rem;
      color: #0284c7;
      font-weight: 800;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.25rem 1.5rem;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 0 0 1.25rem 1.25rem;
    }

    /* Modal Form */
    .modal-form label {
      display: block;
      margin-bottom: 1rem;
      font-size: 0.88rem;
      font-weight: 600;
      color: #334155;
    }
    .modal-form input, .modal-form textarea, .modal-form select {
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
    .modal-form input:focus, .modal-form textarea:focus {
      border-color: #0284c7;
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
    }
    .checkbox-label {
      display: flex !important;
      align-items: center;
      gap: 0.6rem;
      cursor: pointer;
      margin-top: 0.5rem;
    }
    .checkbox-label input {
      width: auto !important;
      margin: 0 !important;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 600px) {
      .form-row { grid-template-columns: 1fr; }
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
    .alert-danger { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .alert-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .btn-close {
      background: transparent;
      border: none;
      font-size: 1.1rem;
      cursor: pointer;
      color: inherit;
      opacity: 0.7;
    }

    /* Common Buttons */
    .btn {
      padding: 0.55rem 1.15rem;
      font-weight: 600;
      border-radius: 0.5rem;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s ease;
      font-size: 0.9rem;
    }
    .btn:hover { opacity: 0.9; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #0284c7; color: #fff; }
    .btn-outline { background: #fff; border: 1px solid #cbd5e1; color: #334155; }
    .btn-outline:hover { background: #f8fafc; border-color: #94a3b8; }
    .btn-danger { background: #ef4444; color: #fff; }
    .btn-sm { padding: 0.35rem 0.65rem; font-size: 0.8rem; }
    .btn-success-light { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }

    /* States */
    .state-card {
      text-align: center;
      padding: 3rem 1.5rem;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      color: #64748b;
    }
    .spinner {
      width: 2.2rem;
      height: 2.2rem;
      border: 3px solid #e2e8f0;
      border-top-color: #0284c7;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 0.75rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .font-bold { font-weight: 700; }
    .text-muted { color: #64748b; }
  `]
})
export class AdminDashboardComponent implements OnInit {

  activeTab: 'ordenes' | 'productos' | 'clientes' = 'ordenes';

  // Datos
  ordenes: Orden[] = [];
  ordenesFiltradas: Orden[] = [];
  busquedaOrden = '';
  filtroEstadoOrden: 'TODOS' | 'PENDIENTE' | 'PROCESADO' | 'COMPLETADO' | 'CANCELADO' = 'TODOS';
  ordenModal: Orden | null = null;

  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  busquedaProducto = '';
  modalProductoAbierto = false;
  productoEnEdicion: Producto = this.nuevoProductoVacio();
  guardandoProducto = false;

  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  busquedaCliente = '';
  modalClienteAbierto = false;
  clienteEnEdicion: Cliente = this.nuevoClienteVacio();
  guardandoCliente = false;

  // Estados de carga
  cargandoOrdenes = false;
  cargandoProductos = false;
  cargandoClientes = false;

  errorMessage = '';
  successMessage = '';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargarOrdenes();
    this.cargarProductos();
    this.cargarClientes();
  }

  seleccionarTab(tab: 'ordenes' | 'productos' | 'clientes') {
    this.activeTab = tab;
    if (tab === 'ordenes') this.cargarOrdenes();
    else if (tab === 'productos') this.cargarProductos();
    else if (tab === 'clientes') this.cargarClientes();
  }

  // ==========================================
  // KPIs
  // ==========================================
  calcularTotalVentas(): number {
    return this.ordenes
      .filter(o => o.estado !== 'CANCELADO')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }

  contarOrdenesPendientes(): number {
    return this.ordenes.filter(o => o.estado === 'PENDIENTE').length;
  }

  contarBajoStock(): number {
    return this.productos.filter(p => (p.stock || 0) <= 5).length;
  }

  // ==========================================
  // GESTIÓN DE ÓRDENES
  // ==========================================
  cargarOrdenes() {
    this.cargandoOrdenes = true;
    this.apiService.obtenerTodasLasOrdenes().pipe(
      finalize(() => this.cargandoOrdenes = false)
    ).subscribe({
      next: (data) => {
        this.ordenes = data.sort((a, b) => (b.id || 0) - (a.id || 0));
        this.filtrarOrdenes();
      },
      error: () => this.mostrarError('Error al cargar órdenes de compra.')
    });
  }

  setFiltroEstado(estado: 'TODOS' | 'PENDIENTE' | 'PROCESADO' | 'COMPLETADO' | 'CANCELADO') {
    this.filtroEstadoOrden = estado;
    this.filtrarOrdenes();
  }

  filtrarOrdenes() {
    const q = this.busquedaOrden.toLowerCase().trim();
    this.ordenesFiltradas = this.ordenes.filter(o => {
      const matchEstado = this.filtroEstadoOrden === 'TODOS' || o.estado === this.filtroEstadoOrden;
      const matchTexto = !q ||
        o.id?.toString().includes(q) ||
        o.cliente?.nombre?.toLowerCase().includes(q) ||
        o.cliente?.email?.toLowerCase().includes(q);
      return matchEstado && matchTexto;
    });
  }

  abrirModalOrden(orden: Orden) {
    this.ordenModal = orden;
  }

  cambiarEstado(orden: Orden, event: Event) {
    const nuevoEstado = (event.target as HTMLSelectElement).value as Orden['estado'];
    const estadoPrevio = orden.estado;

    if (nuevoEstado === estadoPrevio) return;

    if (nuevoEstado === 'CANCELADO' && !confirm(`¿Deseas marcar la orden #${orden.id} como CANCELADA? Se reintegrará el stock de sus productos.`)) {
      (event.target as HTMLSelectElement).value = estadoPrevio;
      return;
    }

    this.apiService.cambiarEstadoOrden(orden.id!, nuevoEstado).subscribe({
      next: (actualizada) => {
        orden.estado = actualizada.estado;
        this.mostrarExito(`Orden #${orden.id} actualizada a ${actualizada.estado}.`);
        this.cargarProductos(); // Refrescar inventario si se canceló o modificó
      },
      error: (err) => {
        (event.target as HTMLSelectElement).value = estadoPrevio;
        this.mostrarError(this.obtenerMensajeError(err, 'No fue posible actualizar el estado de la orden.'));
      }
    });
  }

  eliminarOrden(id: number) {
    if (!confirm(`¿Estás seguro de eliminar permanentemente la orden #${id}?`)) return;

    this.apiService.eliminarOrden(id).subscribe({
      next: () => {
        this.mostrarExito(`Orden #${id} eliminada.`);
        this.cargarOrdenes();
      },
      error: (err) => this.mostrarError(this.obtenerMensajeError(err, 'No se pudo eliminar la orden.'))
    });
  }

  // ==========================================
  // GESTIÓN DE PRODUCTOS
  // ==========================================
  cargarProductos() {
    this.cargandoProductos = true;
    this.apiService.obtenerTodosLosProductos().pipe(
      finalize(() => this.cargandoProductos = false)
    ).subscribe({
      next: (data) => {
        this.productos = data;
        this.filtrarProductos();
      },
      error: () => this.mostrarError('Error al cargar catálogo de productos.')
    });
  }

  filtrarProductos() {
    const q = this.busquedaProducto.toLowerCase().trim();
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

  abrirModalNuevoProducto() {
    this.productoEnEdicion = this.nuevoProductoVacio();
    this.modalProductoAbierto = true;
  }

  abrirModalEditarProducto(producto: Producto) {
    this.productoEnEdicion = { ...producto };
    this.modalProductoAbierto = true;
  }

  guardarProducto() {
    this.guardandoProducto = true;
    const esEdicion = !!this.productoEnEdicion.id;

    const req = esEdicion
      ? this.apiService.actualizarProducto(this.productoEnEdicion.id!, this.productoEnEdicion)
      : this.apiService.crearProducto(this.productoEnEdicion);

    req.pipe(
      finalize(() => this.guardandoProducto = false)
    ).subscribe({
      next: () => {
        this.mostrarExito(esEdicion ? 'Producto actualizado exitosamente.' : 'Producto creado exitosamente.');
        this.modalProductoAbierto = false;
        this.cargarProductos();
      },
      error: (err) => this.mostrarError(this.obtenerMensajeError(err, 'Error al guardar el producto.'))
    });
  }

  toggleActivoProducto(producto: Producto) {
    const productoActualizado: Producto = { ...producto, activo: !producto.activo };
    this.apiService.actualizarProducto(producto.id!, productoActualizado).subscribe({
      next: () => {
        producto.activo = productoActualizado.activo;
        this.mostrarExito(`Producto "${producto.nombre}" ${producto.activo ? 'activado' : 'desactivado'}.`);
      },
      error: (err) => this.mostrarError(this.obtenerMensajeError(err, 'No fue posible cambiar el estado del producto.'))
    });
  }

  eliminarProducto(id: number) {
    if (!confirm('¿Deseas eliminar este producto? Si ya tiene órdenes asociadas se recomienda desactivarlo en su lugar.')) return;

    this.apiService.eliminarProducto(id).subscribe({
      next: () => {
        this.mostrarExito('Producto eliminado.');
        this.cargarProductos();
      },
      error: (err) => this.mostrarError(this.obtenerMensajeError(err, 'No se pudo eliminar el producto. Podría tener órdenes asociadas (usa "Desactivar").'))
    });
  }

  private nuevoProductoVacio(): Producto {
    return {
      nombre: '',
      sku: '',
      descripcion: '',
      precio: 0,
      stock: 0,
      activo: true
    };
  }

  // ==========================================
  // GESTIÓN DE CLIENTES
  // ==========================================
  cargarClientes() {
    this.cargandoClientes = true;
    this.apiService.obtenerTodosLosClientes().pipe(
      finalize(() => this.cargandoClientes = false)
    ).subscribe({
      next: (data) => {
        this.clientes = data;
        this.filtrarClientes();
      },
      error: () => this.mostrarError('Error al cargar clientes.')
    });
  }

  filtrarClientes() {
    const q = this.busquedaCliente.toLowerCase().trim();
    if (!q) {
      this.clientesFiltrados = [...this.clientes];
    } else {
      this.clientesFiltrados = this.clientes.filter(c =>
        c.nombre.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.ciudad && c.ciudad.toLowerCase().includes(q))
      );
    }
  }

  abrirModalNuevoCliente() {
    this.clienteEnEdicion = this.nuevoClienteVacio();
    this.modalClienteAbierto = true;
  }

  abrirModalEditarCliente(cliente: Cliente) {
    this.clienteEnEdicion = { ...cliente };
    this.modalClienteAbierto = true;
  }

  guardarCliente() {
    this.guardandoCliente = true;
    const esEdicion = !!this.clienteEnEdicion.id;

    const req = esEdicion
      ? this.apiService.actualizarCliente(this.clienteEnEdicion.id!, this.clienteEnEdicion)
      : this.apiService.crearCliente(this.clienteEnEdicion);

    req.pipe(
      finalize(() => this.guardandoCliente = false)
    ).subscribe({
      next: () => {
        this.mostrarExito(esEdicion ? 'Cliente actualizado.' : 'Cliente registrado.');
        this.modalClienteAbierto = false;
        this.cargarClientes();
      },
      error: (err) => this.mostrarError(this.obtenerMensajeError(err, 'Error al guardar cliente.'))
    });
  }

  eliminarCliente(id: number) {
    if (!confirm('¿Estás seguro de eliminar este cliente? Se borrarán sus datos asociados.')) return;

    this.apiService.eliminarCliente(id).subscribe({
      next: () => {
        this.mostrarExito('Cliente eliminado.');
        this.cargarClientes();
      },
      error: (err) => this.mostrarError(this.obtenerMensajeError(err, 'No fue posible eliminar el cliente.'))
    });
  }

  private nuevoClienteVacio(): Cliente {
    return {
      nombre: '',
      email: '',
      telefono: '',
      direccion: '',
      ciudad: '',
      pais: 'Chile',
      codigoPostal: ''
    };
  }

  // ==========================================
  // HELPERS
  // ==========================================
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
