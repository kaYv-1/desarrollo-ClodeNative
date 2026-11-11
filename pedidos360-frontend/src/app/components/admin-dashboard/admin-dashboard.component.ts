import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Cliente, Producto, Orden } from '../../services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-dashboard">
      <div class="page-heading">
        <div>
          <span class="eyebrow">Control operativo</span>
          <h1>Panel administrativo</h1>
          <p>Gestiona clientes, catálogo y el ciclo de vida de las órdenes.</p>
        </div>
        <span class="page-icon" aria-hidden="true">⚙️</span>
      </div>

      <div class="tabs">
        <button type="button" (click)="seleccionarTab('clientes')" [class.active]="activeTab === 'clientes'">Clientes</button>
        <button type="button" (click)="seleccionarTab('productos')" [class.active]="activeTab === 'productos'">Productos</button>
        <button type="button" (click)="seleccionarTab('ordenes')" [class.active]="activeTab === 'ordenes'">Órdenes</button>
      </div>

      <div *ngIf="activeTab === 'clientes'" class="tab-content">
        <div class="tab-header">
          <h2>Gestión de Clientes</h2>
          <div class="header-actions">
            <button type="button" (click)="showClienteForm = !showClienteForm">
              {{ showClienteForm ? 'Cerrar Formulario' : 'Crear Cliente' }}
            </button>
            <button type="button" (click)="cargarClientes()" [disabled]="cargandoClientes" class="btn-refresh">
              {{ cargandoClientes ? '🔄 Actualizando...' : '🔄 Refrescar Clientes' }}
            </button>
          </div>
        </div>

        <div *ngIf="cargandoClientes && clientes.length === 0" class="loading-state">
          Cargando clientes...
        </div>

        <form *ngIf="showClienteForm" (ngSubmit)="crearCliente()" class="form">
          <label>Nombre<input [(ngModel)]="nuevoCliente.nombre" name="nombre" placeholder="Nombre completo" required></label>
          <label>Email<input [(ngModel)]="nuevoCliente.email" name="email" placeholder="correo@ejemplo.com" type="email" required></label>
          <label>Teléfono<input [(ngModel)]="nuevoCliente.telefono" name="telefono" placeholder="+56 9..." required></label>
          <label>Dirección<input [(ngModel)]="nuevoCliente.direccion" name="direccion" placeholder="Dirección" required></label>
          <label>Ciudad<input [(ngModel)]="nuevoCliente.ciudad" name="ciudad" placeholder="Ciudad" required></label>
          <label>País<input [(ngModel)]="nuevoCliente.pais" name="pais" placeholder="País" required></label>
          <div class="form-actions"><button type="submit">Guardar cliente</button>
          <button type="button" (click)="showClienteForm = false">Cancelar</button>
          </div>
        </form>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let cliente of clientes">
              <td>{{ cliente.id }}</td>
              <td>{{ cliente.nombre }}</td>
              <td>{{ cliente.email }}</td>
              <td>
                <button (click)="eliminarCliente(cliente.id!)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="activeTab === 'productos'" class="tab-content">
        <div class="tab-header">
          <h2>Gestión de Productos</h2>
          <div class="header-actions">
            <button type="button" (click)="showProductoForm = !showProductoForm">
              {{ showProductoForm ? 'Cerrar Formulario' : 'Crear Producto' }}
            </button>
            <button type="button" (click)="cargarProductos()" [disabled]="cargandoProductos" class="btn-refresh">
              {{ cargandoProductos ? '🔄 Actualizando...' : '🔄 Refrescar Productos' }}
            </button>
          </div>
        </div>

        <div *ngIf="cargandoProductos && productos.length === 0" class="loading-state">
          Cargando productos...
        </div>

        <form *ngIf="showProductoForm" (ngSubmit)="crearProducto()" class="form">
          <label>Nombre<input [(ngModel)]="nuevoProducto.nombre" name="nombre" placeholder="Nombre del producto" required></label>
          <label>Precio<input [(ngModel)]="nuevoProducto.precio" name="precio" placeholder="0" type="number" min="0" required></label>
          <label>Stock<input [(ngModel)]="nuevoProducto.stock" name="stock" placeholder="0" type="number" min="0" required></label>
          <label>Descripción<textarea [(ngModel)]="nuevoProducto.descripcion" name="descripcion" placeholder="Descripción"></textarea></label>
          <div class="form-actions"><button type="submit">Guardar producto</button>
          <button type="button" (click)="showProductoForm = false">Cancelar</button>
          </div>
        </form>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let producto of productos">
              <td>{{ producto.id }}</td>
              <td>{{ producto.nombre }}</td>
              <td>\${{ producto.precio }}</td>
              <td>{{ producto.stock }}</td>
              <td>
                <button (click)="eliminarProducto(producto.id!)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="activeTab === 'ordenes'" class="tab-content">
        <div class="tab-header">
          <h2>Gestión de Órdenes</h2>
          <div class="header-actions">
            <button type="button" (click)="cargarOrdenes()" [disabled]="cargandoOrdenes" class="btn-refresh">
              {{ cargandoOrdenes ? '🔄 Actualizando...' : '🔄 Refrescar Órdenes' }}
            </button>
          </div>
        </div>

        <div *ngIf="cargandoOrdenes && ordenes.length === 0" class="loading-state">
          Cargando órdenes...
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th>Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let orden of ordenes">
              <td>{{ orden.id }}</td>
              <td>{{ orden.cliente.nombre }}</td>
              <td>{{ orden.estado }}</td>
              <td>\${{ orden.total }}</td>
              <td>
                <select (change)="cambiarEstado(orden, $event)" [value]="orden.estado">
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="PROCESADO">Procesado</option>
                  <option value="COMPLETADO">Completado</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="errorMessage" class="error-message">{{ errorMessage }}</div>
      <div *ngIf="successMessage" class="success-message">{{ successMessage }}</div>
    </div>
  `,
  styles: [`
    .admin-dashboard {
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
      background: #007bff;
      color: white;
    }
    .tab-content {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 4px;
      margin-top: 20px;
    }
    .form {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin: 20px 0;
      max-width: 500px;
    }
    input, textarea, select {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    button {
      padding: 8px 16px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
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
    .error-message {
      color: #d32f2f;
      padding: 10px;
      background: #ffebee;
      border-radius: 4px;
      margin-top: 20px;
    }
    .success-message {
      color: #388e3c;
      padding: 10px;
      background: #e8f5e9;
      border-radius: 4px;
      margin-top: 20px;
    }
    .tab-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      flex-wrap: wrap;
      gap: 10px;
    }
    .tab-header h2 {
      margin: 0;
    }
    .header-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .btn-refresh {
      background: #ffffff;
      border: 1px solid #007bff;
      color: #007bff;
      font-weight: 600;
      padding: 7px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9em;
      transition: all 0.2s ease;
    }
    .btn-refresh:hover:not(:disabled) {
      background: #007bff;
      color: #ffffff;
    }
    .btn-refresh:disabled {
      cursor: wait;
      opacity: 0.6;
    }
    .loading-state {
      text-align: center;
      color: #666;
      padding: 20px;
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
    .page-heading p { margin: .5rem 0 0; color: #64748b; }
    .eyebrow {
      color: #2563eb;
      font-size: .72rem;
      font-weight: 700;
      letter-spacing: .12em;
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
      padding: .35rem;
      border: 1px solid #e2e8f0;
      border-radius: .9rem;
      background: #fff;
    }
    .tabs button {
      border: 0;
      border-radius: .65rem;
      background: transparent;
      color: #64748b;
      font-weight: 700;
    }
    .tabs button.active {
      background: #2563eb;
      box-shadow: 0 5px 12px rgba(37, 99, 235, .22);
    }
    .tab-content {
      border: 1px solid #e2e8f0;
      background: rgba(255,255,255,.88);
      box-shadow: 0 12px 35px rgba(15, 23, 42, .06);
      overflow-x: auto;
    }
    .form {
      padding: 1rem;
      border: 1px solid #dbeafe;
      border-radius: .9rem;
      background: #f8fbff;
    }
    .form label {
      display: grid;
      gap: .35rem;
      color: #475569;
      font-size: .85rem;
      font-weight: 600;
    }
    .form input, .form textarea, .form select {
      border-color: #cbd5e1;
      background: #fff;
      padding: .7rem;
    }
    .form-actions { display: flex; gap: .6rem; }
    .form-actions button:last-child { background: #e2e8f0; color: #334155; }
    .tab-content table { min-width: 680px; }
    @media (max-width: 640px) {
      .admin-dashboard { padding: 0; }
      .page-heading { align-items: flex-start; }
      .page-icon { display: none; }
      .header-actions { width: 100%; flex-wrap: wrap; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {

  activeTab: 'clientes' | 'productos' | 'ordenes' = 'clientes';
  showClienteForm = false;
  showProductoForm = false;

  clientes: Cliente[] = [];
  productos: Producto[] = [];
  ordenes: Orden[] = [];

  cargandoClientes = false;
  cargandoProductos = false;
  cargandoOrdenes = false;

  nuevoCliente: Cliente = {
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    pais: ''
  };

  nuevoProducto: Producto = {
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0
  };

  errorMessage = '';
  successMessage = '';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.cargarDatos();
  }

  seleccionarTab(tab: 'clientes' | 'productos' | 'ordenes') {
    this.activeTab = tab;
    if (tab === 'clientes') {
      this.cargarClientes();
    } else if (tab === 'productos') {
      this.cargarProductos();
    } else if (tab === 'ordenes') {
      this.cargarOrdenes();
    }
  }

  cargarDatos() {
    this.cargarClientes();
    this.cargarProductos();
    this.cargarOrdenes();
  }

  cargarClientes() {
    this.cargandoClientes = true;
    this.apiService.obtenerTodosLosClientes().subscribe({
      next: (data) => {
        this.clientes = data;
        this.cargandoClientes = false;
      },
      error: () => {
        this.mostrarError('Error cargando clientes');
        this.cargandoClientes = false;
      }
    });
  }

  cargarProductos() {
    this.cargandoProductos = true;
    this.apiService.obtenerTodosLosProductos().subscribe({
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

  cargarOrdenes() {
    this.cargandoOrdenes = true;
    this.apiService.obtenerTodasLasOrdenes().subscribe({
      next: (data) => {
        this.ordenes = data;
        this.cargandoOrdenes = false;
      },
      error: () => {
        this.mostrarError('Error cargando órdenes');
        this.cargandoOrdenes = false;
      }
    });
  }

  crearCliente() {
    this.apiService.crearCliente(this.nuevoCliente).subscribe({
      next: () => {
        this.mostrarExito('Cliente creado exitosamente');
        this.cargarClientes();
        this.resetClienteForm();
      },
      error: (err) => this.mostrarError(this.obtenerMensajeError(err, 'Error creando cliente'))
    });
  }

  crearProducto() {
    this.apiService.crearProducto(this.nuevoProducto).subscribe({
      next: () => {
        this.mostrarExito('Producto creado exitosamente');
        this.cargarProductos();
        this.resetProductoForm();
      },
      error: (err) => this.mostrarError(this.obtenerMensajeError(err, 'Error creando producto'))
    });
  }

  eliminarCliente(id: number) {
    if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
      this.apiService.eliminarCliente(id).subscribe({
        next: () => {
          this.mostrarExito('Cliente eliminado');
          this.cargarClientes();
        },
        error: (err) => this.mostrarError(this.obtenerMensajeError(err, 'Error eliminando cliente'))
      });
    }
  }

  eliminarProducto(id: number) {
    if (confirm('¿Está seguro de que desea eliminar este producto?')) {
      this.apiService.eliminarProducto(id).subscribe({
        next: () => {
          this.mostrarExito('Producto eliminado');
          this.cargarProductos();
        },
        error: (err) => this.mostrarError(this.obtenerMensajeError(err, 'Error eliminando producto'))
      });
    }
  }

  cambiarEstado(orden: Orden, event: Event) {
    const nuevoEstado = (event.target as HTMLSelectElement).value as Orden['estado'];
    const estadoAnterior = orden.estado;
    this.apiService.cambiarEstadoOrden(orden.id!, nuevoEstado).subscribe({
      next: () => {
        orden.estado = nuevoEstado;
        this.mostrarExito('Estado actualizado');
      },
      error: (err) => {
        orden.estado = estadoAnterior;
        this.mostrarError(this.obtenerMensajeError(err, 'Error actualizando estado'));
      }
    });
  }

  private obtenerMensajeError(error: { error?: { message?: string } }, fallback: string): string {
    return error?.error?.message || fallback;
  }

  private resetClienteForm() {
    this.nuevoCliente = { nombre: '', email: '', telefono: '', direccion: '', ciudad: '', pais: '' };
    this.showClienteForm = false;
  }

  private resetProductoForm() {
    this.nuevoProducto = { nombre: '', descripcion: '', precio: 0, stock: 0 };
    this.showProductoForm = false;
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
