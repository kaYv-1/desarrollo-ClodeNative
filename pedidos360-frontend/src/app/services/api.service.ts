import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Cliente {
  id?: number;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  pais: string;
  codigoPostal?: string;
}

export interface Producto {
  id?: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  sku?: string;
  activo?: boolean;
}

export interface Orden {
  id?: number;
  cliente: Cliente;
  estado: 'PENDIENTE' | 'PROCESADO' | 'COMPLETADO' | 'CANCELADO';
  total: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  detalles?: DetallePedido[];
}

export interface DetallePedido {
  id?: number;
  orden?: Orden;
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface PerfilAutenticado {
  authenticated: boolean;
  user: string;
  preferred_username: string;
  name: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiUrl = environment.azure.apiEndpoint;

  constructor(private http: HttpClient) {}

  obtenerPerfilAutenticado(): Observable<PerfilAutenticado> {
    return this.http.get<PerfilAutenticado>(`${this.apiUrl}/api/me`);
  }

  // Cliente endpoints
  crearCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.apiUrl}/api/clientes`, cliente);
  }

  obtenerCliente(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/api/clientes/${id}`);
  }

  obtenerTodosLosClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/api/clientes`);
  }

  actualizarCliente(id: number, cliente: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/api/clientes/${id}`, cliente);
  }

  eliminarCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/clientes/${id}`);
  }

  // Producto endpoints
  crearProducto(producto: Producto): Observable<Producto> {
    return this.http.post<Producto>(`${this.apiUrl}/api/productos`, producto);
  }

  obtenerProducto(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/api/productos/${id}`);
  }

  obtenerTodosLosProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/api/productos`);
  }

  obtenerProductosActivos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/api/productos/activos`);
  }

  actualizarProducto(id: number, producto: Producto): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/api/productos/${id}`, producto);
  }

  eliminarProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/productos/${id}`);
  }

  // Orden endpoints
  crearOrden(orden: Orden): Observable<Orden> {
    return this.http.post<Orden>(`${this.apiUrl}/api/ordenes`, orden);
  }

  obtenerOrden(id: number): Observable<Orden> {
    return this.http.get<Orden>(`${this.apiUrl}/api/ordenes/${id}`);
  }

  obtenerTodasLasOrdenes(): Observable<Orden[]> {
    return this.http.get<Orden[]>(`${this.apiUrl}/api/ordenes`);
  }

  obtenerOrdenesPorCliente(clienteId: number): Observable<Orden[]> {
    return this.http.get<Orden[]>(`${this.apiUrl}/api/ordenes/cliente/${clienteId}`);
  }

  obtenerOrdenesPorEstado(estado: string): Observable<Orden[]> {
    return this.http.get<Orden[]>(`${this.apiUrl}/api/ordenes/estado/${estado}`);
  }

  agregarDetalleAOrden(ordenId: number, detalle: DetallePedido): Observable<Orden> {
    return this.http.post<Orden>(`${this.apiUrl}/api/ordenes/${ordenId}/detalles`, detalle);
  }

  cambiarEstadoOrden(ordenId: number, nuevoEstado: string): Observable<Orden> {
    return this.http.put<Orden>(`${this.apiUrl}/api/ordenes/${ordenId}/estado?nuevoEstado=${nuevoEstado}`, {});
  }

  eliminarOrden(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/ordenes/${id}`);
  }
}
