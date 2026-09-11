# INFORME TÉCNICO DE PROYECTO: PEDIDOS360
**Asignatura:** Desarrollo Cloud Native I (DSY1107)  
**Evaluación:** Evaluación Parcial N.° 1  
**Integrantes:**
- **Israel Poblete**
- **Ángel Venegas**  
**Repositorio Oficial:** [https://github.com/kaYv-1/desarrollo-ClodeNative.git](https://github.com/kaYv-1/desarrollo-ClodeNative.git)  
**Rama:** `main`  
**Fecha:** Septiembre 2026  

---

## 1. Resumen Ejecutivo e Introducción

El proyecto **Pedidos360** es una solución de comercio electrónico empresarial construida bajo el paradigma **Cloud Native**. Su objetivo principal es proveer una plataforma robusta, desacoplada y altamente segura para la comercialización y administración de pedidos, implementando estándares industriales de autenticación centralizada y autorización basada en roles (RBAC).

La arquitectura desacopla completamente el cliente web (Frontend SPA) del servidor de servicios de negocio (Backend REST), delegando la gestión de identidades y credenciales en **Microsoft Entra ID (Azure Active Directory)** mediante tokens criptográficos **JWT (JSON Web Tokens)** conforme a la especificación OAuth 2.0 / OpenID Connect.

### Indicadores de Evaluación Institucional
| Indicador Institucional | Ponderación | Estado |
|---|:---:|:---:|
| **Integración Frontend:** Angular + MSAL, inicio/cierre de sesión, guardias y envío de Bearer Tokens | **60%** | **Cumplido al 100%** |
| **Seguridad Backend:** Spring Security Resource Server, validación JWT y autorización por métodos (RBAC) | **40%** | **Cumplido al 100%** |

---

## 2. Arquitectura del Sistema

La solución adopta un patrón cliente-servidor distribuido preparado para despliegues contenerizados en la nube pública:

```text
+-----------------------------------------------------------------------------+
|                          MICROSOFT ENTRA ID (AZURE AD)                      |
|                  Emisor de Tokens (JWKS, Issuer, Roles y Scopes)            |
+-----------------------------------------------------------------------------+
              ^                                         ^
              | 1. Autenticación (MSAL)                 | 3. Validación JWKS
              v                                         v
+-----------------------------+          +------------------------------------+
|   FRONTEND SPA (Angular)    |  2. REST |     BACKEND REST (Spring Boot)     |
|   Puerto 4200               |  Bearer  |     Puerto 8080                    |
|-----------------------------|  Token   |------------------------------------|
| - MsalGuard & RoleGuard     | -------->| - OAuth2 Resource Server           |
| - Interceptores HTTP Bearer |          | - NimbusJwtDecoder (Issuer/Aud)    |
| - Portal Cliente            |          | - AzureJwtAuthenticationConverter  |
| - Panel Administrador       |          | - Controladores REST RBAC          |
+-----------------------------+          +------------------------------------+
                                                        |
                                                        v
                                         +------------------------------------+
                                         |      PERSISTENCIA RELACIONAL       |
                                         | - Local: H2 Database en Memoria    |
                                         | - Cloud: PostgreSQL (AWS RDS)      |
                                         +------------------------------------+
```

### 2.1 Flujo de Autenticación y Autorización
1. **Inicio de Sesión:** El usuario interactúa con la aplicación Angular, la cual inicia el flujo de inicio de sesión mediante redirección con `@azure/msal-browser` y `@azure/msal-angular`.
2. **Emisión de Credenciales:** Microsoft Entra ID autentica las credenciales corporativas y emite un `idToken` y un `accessToken` firmado que incluye los claims de identidad (`preferred_username`, `name`) y los roles asignados (`roles: ["ADMIN"]` o `roles: ["CLIENTE"]`).
3. **Inyección en Peticiones:** El interceptor de Angular (`msalInterceptorFn`) intercepta automáticamente las peticiones dirigidas al backend e inyecta la cabecera estándar `Authorization: Bearer <token>`.
4. **Validación en Backend:** Spring Security actúa como **OAuth2 Resource Server**. Valida la firma del token contra las claves públicas JWKS de Microsoft, corrobora el emisor (`issuer-uri`) y la audiencia (`audiences`), mapeando los roles del JWT a autoridades Spring (`ROLE_ADMIN`, `ROLE_CLIENTE`).
5. **Control de Acceso (RBAC):** Cada endpoint REST evalúa las autoridades requeridas mediante la anotación `@PreAuthorize`.

---

## 3. Módulos y Funcionalidades Desarrolladas

### 3.1 Frontend (Angular 22)
- **Control de Rutas y Seguridad:**
  - `MsalGuard`: Restringe el acceso a usuarios no autenticados, redirigiendo a Microsoft Entra ID.
  - `RoleGuard`: Lee los roles asignados en el token JWT y restringe rutas específicas:
    - `/portal`: Reservado para usuarios con rol `CLIENTE`.
    - `/admin`: Reservado para usuarios con rol `ADMIN`.
    - `/403`: Vista informativa de acceso denegado.
  - Detección automática del rol tras el inicio de sesión y redirección sin bucles.
- **Portal de Clientes (`ClientePortalComponent`):**
  - **Catálogo Interactivo:** Listado de productos activos, visualización de precio, descripción y control visual de stock con botón de actualización inmediata (`🔄 Refrescar Catálogo`).
  - **Carrito de Compras:** Agregado dinámico, modificación de cantidades respetando el límite de inventario y cálculo de subtotales/totales.
  - **Checkout Real:** Envío de órdenes a la API (`POST /api/ordenes`), deducción automática de stock en base de datos y confirmación con ID de pedido.
  - **Mis Órdenes:** Historial del cliente autenticado con estados (`PENDIENTE`, `PROCESADO`, `COMPLETADO`, `CANCELADO`) y botón de recarga (`🔄 Refrescar Órdenes`).
  - Pestañas reactivas que actualizan los datos desde el backend al cambiar entre ellas.
- **Panel Administrativo (`AdminDashboardComponent`):**
  - Gestión integral (CRUD) de Clientes (creación y eliminación).
  - Gestión integral (CRUD) de Productos (creación, edición de stock, precios y descripción).
  - Supervisión de Órdenes globales y cambio de estado transaccional.
  - Pestañas reactivas y botones de actualización manual por sección.

### 3.2 Backend (Java 17 & Spring Boot 3.5)
- **Configuración de Seguridad (`SecurityConfig`):**
  - Configuración de CORS para orígenes autorizados (`localhost:4200`).
  - Deshabilitación de CSRF para API Stateless y habilitación de `@EnableMethodSecurity`.
  - Integración del conversor personalizado `AzureJwtAuthenticationConverter` para transformar claims `roles` a autoridades `ROLE_*`.
- **Servicios de Negocio y Dominio:**
  - `ClienteService`: Gestión de perfiles y consulta por email extraído del token JWT.
  - `ProductoService`: Control de catálogo, validación y decremento de stock ante compras.
  - `OrdenService`: Creación atómica de pedidos vinculados automáticamente a la identidad del cliente extraída del JWT (`crearOrdenParaUsuario`), cálculo garantizado de totales y restricciones de propiedad (un cliente solo puede visualizar sus propias órdenes).
- **Manejo Centralizado de Excepciones (`GlobalExceptionHandler`):**
  - Respuestas JSON uniformes ante errores `400 Bad Request`, `403 Forbidden` y `500 Internal Server Error`.
- **Persistencia Dual:**
  - Perfil local `h2`: Base de datos en memoria para pruebas y desarrollo ágil.
  - Perfil cloud `postgres`: Preparado para bases de datos administradas (AWS RDS).

---

## 4. Matriz de Cumplimiento de Requerimientos

| Área | Requisito de la Pauta | Implementación / Evidencia | Estado |
|:---|:---|:---|:---:|
| **Frontend** | Aplicación funcional en Angular | Angular 22 modular, compilación limpia con `npm run build`. | **Cumple** |
| **Frontend** | Login y Logout con MSAL | Implementación en `app.ts` usando `@azure/msal-angular` y `msal-browser`. | **Cumple** |
| **Frontend** | Protección de rutas (`MsalGuard` / `RoleGuard`) | Rutas `/portal` y `/admin` protegidas en `app.routes.ts` con lectura de roles JWT. | **Cumple** |
| **Frontend** | Interceptor HTTP e inyección de token | `msalInterceptorFn` inyecta cabecera `Authorization: Bearer <token>` a llamadas backend. | **Cumple** |
| **Frontend** | Manejo de respuestas 401 y 403 | Interceptor `authErrorInterceptor` captura eventos y muestra alertas descriptivas al usuario. | **Cumple** |
| **Frontend** | Vistas y experiencia de usuario | Catálogo con stock real, carrito, checkout, órdenes y panel admin con recarga reactiva. | **Cumple** |
| **Backend** | Spring Boot OAuth2 Resource Server | `SecurityConfig.java` configurado con NimbusJwtDecoder y claves JWKS. | **Cumple** |
| **Backend** | Validación de Issuer y Audience | Validado en `application.properties` contra el Tenant y Client ID de Azure. | **Cumple** |
| **Backend** | Mapeo de Roles a Autoridades | `AzureJwtAuthenticationConverter.java` mapea roles a autoridades `ROLE_ADMIN` / `ROLE_CLIENTE`. | **Cumple** |
| **Backend** | Autorización por método (`@PreAuthorize`) | Implementado en todos los endpoints de `ClienteController`, `ProductoController` y `OrdenController`. | **Cumple** |
| **Backend** | Endpoints de Perfil y Salud | `/api/me` expone el perfil y roles del JWT validado; `/actuator/health` expone estado UP. | **Cumple** |
| **Backend** | Integridad de Dominio y Transacciones | `OrdenService` valida disponibilidad de stock, resta inventario y calcula totales. | **Cumple** |
| **Backend** | Control de propiedad de órdenes | Usuarios normales solo acceden a sus órdenes; administradores acceden a la gestión global. | **Cumple** |
| **Cloud** | Diseño de Arquitectura AWS | Guía técnica y diseño topológico documentado en `docs/deployment-aws.md`. | **Documentado** |
| **Cloud** | Contenerización Docker | `Dockerfile` multi-stage optimizado para despliegue en instancias EC2. | **Cumple** |

---

## 5. Diseño para Despliegue en AWS (Cloud Native)

La infraestructura cloud proyectada para producción sigue las mejores prácticas de AWS:

```text
[Internet]
    |
    v
[AWS Route 53 (DNS)]
    |
    v
[AWS API Gateway (HTTP API)]
    * Validador JWT integrado (Issuer y Audience de Azure AD)
    * Único punto de entrada público para la API
    |
    v (VPC Link)
[Network Load Balancer (NLB Privado)]
    |
    v (Puerto 8080)
[Amazon EC2 (Auto Scaling Group)]
    * Contenedor Docker de pedidos360-backend (Java 17)
    * Security Group restringido: solo acepta tráfico del NLB
    |
    v
[Amazon RDS PostgreSQL (Multi-AZ)]
    * Subnets privadas sin acceso directo a Internet
```

---

## 6. Guía de Ejecución Local

### 6.1 Requisitos del Sistema
- **Java Development Kit (JDK):** Versión 17 LTS o superior instalada y configurada en el `PATH`.
- **Apache Maven:** Versión 3.9 o superior.
- **Node.js:** Versión 20 LTS o superior y gestor de paquetes `npm`.
- **Navegador Web:** Con soporte para ventanas emergentes o redirecciones.

---

### 6.2 Paso 1: Puesta en Marcha del Backend

1. Abra una terminal en el directorio del proyecto y acceda a la carpeta del backend:
   ```powershell
   cd pedidos360-backend
   ```
2. Inicie la aplicación mediante Maven:
   ```powershell
   mvn spring-boot:run
   ```
3. Verifique que el servicio se encuentre activo:
   - **URL Base:** `http://localhost:8080`
   - **Chequeo de Salud:** `http://localhost:8080/actuator/health` (debe responder `{"status":"UP"}`)
   - **Consola de Base de Datos H2:** `http://localhost:8080/h2-console`
     - *JDBC URL:* `jdbc:h2:mem:testdb`
     - *Usuario:* `sa`
     - *Contraseña:* *(en blanco)*

---

### 6.3 Paso 2: Puesta en Marcha del Frontend

1. En una nueva ventana de terminal, diríjase a la carpeta del frontend:
   ```powershell
   cd pedidos360-frontend
   ```
2. Instale las dependencias del proyecto (si es la primera vez):
   ```powershell
   npm install
   ```
3. Inicie el servidor de desarrollo de Angular:
   ```powershell
   npm start
   ```
   *(En entornos Windows con políticas de ejecución restringidas en PowerShell, use `npm.cmd start`).*
4. Abra su navegador en:
   ```text
   http://localhost:4200/
   ```

---

### 6.4 Paso 3: Flujo de Uso del Sistema

1. **Autenticación:** En la pantalla principal, presione **"Iniciar Sesión Azure AD"**.
2. **Inicio de Sesión en Microsoft:** Ingrese con sus credenciales de Microsoft Entra ID vinculadas al Tenant del proyecto.
3. **Redirección Automática por Rol:**
   - Si su cuenta tiene asignado el rol **CLIENTE**, el sistema lo dirigirá automáticamente a `http://localhost:4200/portal` para explorar el catálogo, agregar ítems al carrito y crear órdenes.
   - Si su cuenta tiene asignado el rol **ADMIN**, el sistema lo dirigirá automáticamente a `http://localhost:4200/admin` para administrar clientes, productos y órdenes.
4. **Cierre de Sesión:** El botón **"Cerrar Sesión"** en la barra superior finaliza la sesión local y revoca los tokens activos mediante la ventana de Microsoft.

---

## 7. Conclusiones

La solución **Pedidos360** cumple a cabalidad con todos los lineamientos técnicos y de seguridad exigidos en la evaluación:
- La seguridad perimetral y de aplicación no depende de contraseñas locales vulnerables, sino de un proveedor de identidades de clase empresarial (**Microsoft Entra ID**).
- El backend actúa de forma estrictamente desacoplada como **Resource Server**, validando cada token criptográficamente y aplicando RBAC granular a nivel de servicio y controlador.
- El frontend provee una experiencia reactiva y protegida con validación de roles en tiempo real y comunicación segura mediante interceptores.
- La arquitectura y componentes se encuentran preparados para la siguiente etapa de despliegue contenerizado en la nube de **Amazon Web Services (AWS)**.
