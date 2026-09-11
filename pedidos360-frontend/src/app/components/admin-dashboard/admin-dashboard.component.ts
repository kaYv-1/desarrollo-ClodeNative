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
      <h1>Panel Administrativo</h1>

      <div class="tabs">
        <button (click)="activeTab = 'clientes'" [class.active]="activeTab === 'clientes'">Clientes</button>
        <button (click)="activeTab = 'productos'" [class.active]="activeTab === 'productos'">Productos</button>
        <button (click)="activeTab = 'ordenes'" [class.active]="activeTab === 'ordenes'">Órdenes</button>
      </div>

      <div *ngIf="activeTab === 'clientes'" class="tab-content">
        <h2>Gestión de Clientes</h2>
        <button (click)="showClienteForm = !showClienteForm">Crear Cliente</button>

        <form *ngIf="showClienteForm" (ngSubmit)="crearCliente()" class="form">
          <input [(ngModel)]="nuevoCliente.nombre" name="nombre" placeholder="Nombre" required>
          <input [(ngModel)]="nuevoCliente.email" name="email" placeholder="Email" type="email" required>
          <input [(ngModel)]="nuevoCliente.telefono" name="telefono" placeholder="Teléfono" required>
          <input [(ngModel)]="nuevoCliente.direccion" name="direccion" placeholder="Dirección" required>
          <input [(ngModel)]="nuevoCliente.ciudad" name="ciudad" placeholder="Ciudad" required>
          <input [(ngModel)]="nuevoCliente.pais" name="pais" placeholder="País" required>
          <button type="submit">Guardar</button>
          <button type="button" (click)="showClienteForm = false">Cancelar</button>
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
        <h2>Gestión de Productos</h2>
        <button (click)="showProductoForm = !showProductoForm">Crear Producto</button>

        <form *ngIf="showProductoForm" (ngSubmit)="crearProducto()" class="form">
          <input [(ngModel)]="nuevoProducto.nombre" name="nombre" placeholder="Nombre" required>
          <input [(ngModel)]="nuevoProducto.precio" name="precio" placeholder="Precio" type="number" required>
          <input [(ngModel)]="nuevoProducto.stock" name="stock" placeholder="Stock" type="number" required>
          <textarea [(ngModel)]="nuevoProducto.descripcion" name="descripcion" placeholder="Descripción"></textarea>
          <button type="submit">Guardar</button>
          <button type="button" (click)="showProductoForm = false">Cancelar</button>
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
        <h2>Gestión de Órdenes</h2>
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
                <select (change)="cambiarEstado(orden.id!, $event)" [value]="orden.estado">
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
  `]
})
export class AdminDashboardComponent implements OnInit {

  activeTab: 'clientes' | 'productos' | 'ordenes' = 'clientes';
  showClienteForm = false;
  showProductoForm = false;

  clientes: Cliente[] = [];
  productos: Producto[] = [];
  ordenes: Orden[] = [];

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

  cargarDatos() {
    this.apiService.obtenerTodosLosClientes().subscribe({
      next: (data) => this.clientes = data,
      error: (err) => this.mostrarError('Error cargando clientes')
    });

    this.apiService.obtenerTodosLosProductos().subscribe({
      next: (data) => this.productos = data,
      error: (err) => this.mostrarError('Error cargando productos')
    });

    this.apiService.obtenerTodasLasOrdenes().subscribe({
      next: (data) => this.ordenes = data,
      error: (err) => this.mostrarError('Error cargando órdenes')
    });
  }

  crearCliente() {
    this.apiService.crearCliente(this.nuevoCliente).subscribe({
      next: () => {
        this.mostrarExito('Cliente creado exitosamente');
        this.cargarDatos();
        this.resetClienteForm();
      },
      error: () => this.mostrarError('Error creando cliente')
    });
  }

  crearProducto() {
    this.apiService.crearProducto(this.nuevoProducto).subscribe({
      next: () => {
        this.mostrarExito('Producto creado exitosamente');
        this.cargarDatos();
        this.resetProductoForm();
      },
      error: () => this.mostrarError('Error creando producto')
    });
  }

  eliminarCliente(id: number) {
    if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
      this.apiService.eliminarCliente(id).subscribe({
        next: () => {
          this.mostrarExito('Cliente eliminado');
          this.cargarDatos();
        },
        error: () => this.mostrarError('Error eliminando cliente')
      });
    }
  }

  eliminarProducto(id: number) {
    if (confirm('¿Está seguro de que desea eliminar este producto?')) {
      this.apiService.eliminarProducto(id).subscribe({
        next: () => {
          this.mostrarExito('Producto eliminado');
          this.cargarDatos();
        },
        error: () => this.mostrarError('Error eliminando producto')
      });
    }
  }

  cambiarEstado(ordenId: number, event: any) {
    const nuevoEstado = event.target.value;
    this.apiService.cambiarEstadoOrden(ordenId, nuevoEstado).subscribe({
      next: () => {
        this.mostrarExito('Estado actualizado');
        this.cargarDatos();
      },
      error: () => this.mostrarError('Error actualizando estado')
    });
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
