# Pedidos360

Informe técnico y registro de avance para la Evaluación Parcial N.° 1 de Desarrollo Cloud Native I (DSY1107).

## 1. Objetivo institucional

Construir la arquitectura base de Pedidos360 integrando:

- Frontend Angular con autenticación Azure AD mediante MSAL.
- Backend Java Spring Boot protegido mediante validación JWT.
- Comunicación segura entre frontend, backend y servicios cloud.
- Persistencia relacional y componentes preparados para despliegue cloud.
- Código fuente entregable mediante GitHub.

La pauta institucional pondera dos indicadores principales:

| Indicador | Ponderación |
|---|---:|
| Integración Angular + MSAL y obtención de tokens | 60% |
| Validación JWT y autorización en el backend/BFF | 40% |

## 2. Estructura actual

```text
pedidos360-frontend/   Aplicación Angular y MSAL
pedidos360-backend/    Aplicación Spring Boot, JPA y OAuth2 Resource Server
```

El repositorio contiene actualmente un backend Spring Boot modularizado internamente, pero todavía no están separados varios microservicios independientes ni existe infraestructura AWS versionada.

## 3. Matriz de cumplimiento

### 3.1 Angular, MSAL y tokens

| Requisito | Estado | Evidencia |
|---|---|---|
| Aplicación Angular funcional | Cumple | `pedidos360-frontend/` compila con `npm run build` sin errores. |
| Login con MSAL | Cumple | `src/app/app.ts` y `src/app/app.config.ts` implementan MSAL Redirect. |
| Logout | Cumple | Botón de cierre de sesión integrado en la barra de navegación. |
| `MsalGuard` | Cumple | Protege `/admin` y `/portal` en `src/app/app.routes.ts`. |
| Guard de roles | Cumple | `src/app/guards/role.guard.ts` lee `roles` del token y opera con RxJS `of()`. |
| `MsalInterceptor` | Cumple | `src/app/http-interceptors.ts` inyecta token en llamadas a la API. |
| Scope `access_as_user` | Cumple | Definido en `src/environments/environment.ts`. |
| Token enviado al backend | Cumple | Cabecera `Authorization: Bearer <token>` adjunta en llamadas REST. |
| Manejo global 401/403 | Cumple | `authErrorInterceptor` y `GlobalExceptionHandler` manejan 401/403 de forma estandarizada. |
| Vistas funcionales | Cumple | Catálogo, Carrito interactivo con Checkout real a backend, Mis Órdenes y Panel Admin. |

### 3.2 Backend, JWT y autorización

| Requisito | Estado | Evidencia |
|---|---|---|
| Spring OAuth2 Resource Server | Cumple | `SecurityConfig.java` configura `oauth2ResourceServer().jwt()`. |
| Validación de issuer | Cumple | `application.properties` valida el issuer de Microsoft Entra ID. |
| Validación de audience | Cumple | Configurada en `application.properties` con el Client ID de Azure. |
| Firma y expiración JWT | Cumple | Validación delegada al NimbusJwtDecoder con claves públicas JWKS de Microsoft. |
| Conversión de roles | Cumple | `AzureJwtAuthenticationConverter.java` mapea `roles` a autoridades `ROLE_*`. |
| Autorización por método | Cumple | `@EnableMethodSecurity` y `@PreAuthorize` en todos los controladores REST. |
| Respuestas 401/403 | Cumple | `SecurityMockMvcTest` verifica 401 sin token, 403 sin rol y 200 con `ROLE_ADMIN`. |
| Perfil autenticado | Cumple | `/api/me` expone identidad y roles del JWT validado. |
| Control de excepciones | Cumple | `GlobalExceptionHandler` retorna 400 Bad Request, 403 Forbidden y 500 JSON. |

### 3.3 Dominio y persistencia

| Requisito | Estado | Evidencia |
|---|---|---|
| Entidades JPA relacionales | Cumple | `Cliente`, `Producto`, `Orden` y `DetallePedido` con `@JsonManagedReference` y `@JsonBackReference`. |
| Repositorios Spring Data | Cumple | Repositorios CRUD y consultas personalizadas por email y estado. |
| CRUD de clientes | Cumple | `ClienteController` y `ClienteService` protegidos con RBAC. |
| CRUD de productos | Cumple | `ProductoController` y `ProductoService` con control de catálogo. |
| CRUD de órdenes | Cumple | `OrdenController` y `OrdenService` con creación y cambio de estados. |
| Estados de orden | Cumple | `PENDIENTE`, `PROCESADO`, `COMPLETADO`, `CANCELADO`. |
| Totales y stock | Cumple | `OrdenServiceTest` valida cálculo de subtotal, total y descuento de inventario. |
| Base de datos y migración | Cumple | Perfiles `h2` (local) y `postgres` (cloud) con scripts `schema.sql` y `data.sql`. |
| Control de propiedad de órdenes | Cumple | Clientes asocian su identidad JWT automáticamente y solo acceden a sus propios registros. |

### 3.4 Arquitectura cloud y entrega

| Requisito | Estado | Evidencia |
|---|---|---|
| API Gateway AWS | Documentado | Arquitectura y guía técnica en `docs/deployment-aws.md`. |
| Instancias EC2 | Documentado | `Dockerfile` multi-stage con Java 17 LTS listo para contenedor en EC2. |
| Microservicios Spring Boot | Documentado | Arquitectura modular orientada al dominio (Clientes, Productos, Órdenes). |
| `.gitignore` raíz | Cumple | Configurado para Java/Maven, Angular/Node y artefactos temporales. |

## 4. Evidencia de validación local

### Frontend

- `npm run build`: compilación exitosa sin errores TypeScript.
- `npm start`: servidor disponible en `http://localhost:4200` con redirección a `/portal`.
- Modo Demo disponible en `http://localhost:4200/?demo=true` para pruebas sin credenciales de Azure.

### Backend

- `mvn test`: 11 pruebas ejecutadas exitosamente con Java 17 LTS.
  - `AzureJwtAuthenticationConverterTest`: 3 pruebas exitosas.
  - `SecurityMockMvcTest`: 5 pruebas exitosas (RBAC, 401, 403, 200 y extracción de claims).
  - `OrdenServiceTest`: 2 pruebas exitosas (stock y cálculo de precios).
  - `Pedidos360BackendApplicationTests`: 1 prueba exitosa (carga de contexto Spring).

## 5. Cómo ejecutar localmente

### Modo demo local sin Azure

Para presentar las vistas y el dominio mientras se resuelve la integración Azure, existe un modo demo explícito. No usa MSAL, no representa una autenticación real y no debe utilizarse en producción.

Backend:

```powershell
$env:SPRING_PROFILES_ACTIVE="demo"
cd pedidos360-backend
mvn spring-boot:run
```

Frontend:

```text
http://localhost:4200/?demo=true
```

El modo demo muestra el usuario `Angel Demo` con rol `ADMIN`, permite probar el panel administrativo y usa H2 aislado. La URL normal `http://localhost:4200/` continúa usando Azure MSAL y JWT.

### Backend

Requisitos: Java 17 LTS o superior y Maven 3.9 o superior.

```powershell
cd pedidos360-backend
mvn spring-boot:run
```

Backend local: `http://localhost:8080`

Salud: `http://localhost:8080/actuator/health`

### Frontend

Requisitos: Node.js LTS y npm.

```powershell
cd pedidos360-frontend
npm install
npm start
```

Frontend local: `http://localhost:4200`

## 6. Plan de cierre priorizado

1. Agregar pruebas de validación criptográfica JWT con issuer, expiración y audience incorrectos.
2. Aplicar autorización por propietario al crear órdenes y agregar detalles.
3. Provisionar PostgreSQL cloud y ejecutar una migración real.
4. Provisionar EC2, balanceador, VPC Link y API Gateway.
5. Separar servicios o documentar la decisión arquitectónica si la evaluación permite un backend modular.
6. Completar pruebas E2E del flujo login, catálogo, creación de orden y transición de estado.
7. Ordenar commits y dejar el repositorio listo para entrega.

## 7. Registro de cambios

### 2026-09-10

- Auditoría de la pauta institucional contra el código real.
- Confirmación de la configuración de redirect URI y scope `access_as_user` en Azure.
- Revisión de los puntos faltantes: API Gateway, EC2, microservicios y base cloud.
- Refuerzo de la lógica de órdenes para usar precio real, validar stock y calcular totales.
- Agregadas pruebas unitarias de órdenes: 2 pruebas exitosas.
- Agregadas pruebas de seguridad JWT/RBAC: 6 pruebas exitosas.
- Restringida la consulta de órdenes de clientes a sus propios registros.
- Agregada exposición de roles en `/api/me`.
- Separados perfiles H2 local y PostgreSQL cloud.
- Agregados `Dockerfile`, `.gitignore` raíz y guía `docs/deployment-aws.md`.
- Corregido el `router-outlet` raíz: `/portal`, `/admin` y `/403` ahora renderizan sus vistas.
- Verificado el flujo real Azure -> frontend -> `/api/me`: autenticación y token correctos, roles ausentes.
- Diagnóstico posterior: el token renovado sí contenía `roles: ["ADMIN"]`, pero el caché MSAL anterior no se restauraba al iniciar la aplicación; se cambió a `sessionStorage` y se limpió la caché antigua.
- Agregado modo demo aislado (`?demo=true`) para evidenciar frontend, routing, CRUD y dominio sin presentar la demo como autenticación Azure.
- Frontend y backend compilados localmente.
