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
| Aplicación Angular funcional | Cumple | `pedidos360-frontend/` compila con `npm run build`. |
| Login con MSAL | Parcial | `src/app/app.ts` y `src/app/app.config.ts` implementan MSAL. La autenticación real fue comprobada; queda pendiente estabilizar el flujo entre navegadores y cerrar logout. |
| Logout | Parcial | Existe `logoutPopup`; debe probarse en el navegador objetivo. |
| `MsalGuard` | Cumple en código | Protege `/admin` y `/portal` en `src/app/app.routes.ts`. |
| Guard de roles | Cumple en código | `src/app/guards/role.guard.ts` lee `roles` del `idTokenClaims`. |
| `MsalInterceptor` | Cumple en código | `src/app/http-interceptors.ts` y registro en `app.config.ts`. |
| Scope `access_as_user` | Cumple en configuración | Definido en `src/environments/environment.ts`. |
| Token enviado al backend | Cumple localmente | `/api/me` respondió correctamente con la sesión Azure. El endpoint todavía apunta a `http://localhost:8080`; falta probar API Gateway real. |
| Manejo global 401/403 | Cumple en código | `authErrorInterceptor` emite mensajes visibles para ambos estados. |

### 3.2 Backend, JWT y autorización

| Requisito | Estado | Evidencia |
|---|---|---|
| Spring OAuth2 Resource Server | Cumple | `SecurityConfig.java` configura `oauth2ResourceServer().jwt()`. |
| Validación de issuer | Cumple en configuración | `application.properties` declara el issuer de Microsoft Entra ID. |
| Validación de audience | Parcial | Existe la audience `api://...`; falta probar tokens con audience válida e inválida. |
| Firma y expiración JWT | Cumple por Spring Security | La validación se delega al decoder configurado mediante `issuer-uri`. |
| Conversión de roles | Cumple en código | `AzureJwtAuthenticationConverter.java` transforma `roles` en autoridades `ROLE_*`. |
| Autorización por método | Cumple | Hay `@EnableMethodSecurity` y `@PreAuthorize` en controladores. La prueba real mostró `403` cuando el token no trae roles. |
| Respuestas 401/403 | Cumple con pruebas | `SecurityMockMvcTest` verifica `401` sin token, `403` sin rol y `200` con `ROLE_ADMIN`. |
| Perfil autenticado | Cumple en código | `/api/me` devuelve identidad y roles del JWT. |

### 3.3 Dominio y persistencia

| Requisito | Estado | Evidencia |
|---|---|---|
| Entidades JPA relacionales | Cumple | `Cliente`, `Producto`, `Orden` y `DetallePedido`. |
| Repositorios Spring Data | Cumple | Repositorios CRUD para las cuatro entidades. |
| CRUD de clientes | Cumple en código | `ClienteController` y `ClienteService`. |
| CRUD de productos | Cumple en código | `ProductoController` y `ProductoService`. |
| CRUD de órdenes | Cumple en código | `OrdenController` y `OrdenService`. |
| Estados de orden | Cumple | `PENDIENTE`, `PROCESADO`, `COMPLETADO`, `CANCELADO`. |
| Totales y stock | Cumple con pruebas unitarias | `OrdenServiceTest` verifica precio real, total y descuento de stock. |
| Base de datos cloud | Parcial | H2 queda en el perfil local y PostgreSQL está configurado en `application-postgres.properties` con variables de entorno; falta conectar una instancia cloud real. |
| Control de propiedad de órdenes | Parcial | Las consultas por lista e ID filtran por el correo del JWT para clientes; falta aplicar la misma regla al crear órdenes y agregar detalles. |

### 3.4 Arquitectura cloud y entrega

| Requisito | Estado | Evidencia |
|---|---|---|
| API Gateway AWS | Documentado | La arquitectura y configuración objetivo están en `docs/deployment-aws.md`; falta provisionar la cuenta AWS real. |
| Instancias EC2 | Documentado | Existe Dockerfile y procedimiento de despliegue en EC2; falta ejecutar el despliegue real. |
| Varios microservicios Spring Boot | Pendiente | Actualmente existe un solo módulo backend. |
| Docker/IaC | Parcial | Existe `pedidos360-backend/Dockerfile`; Terraform/CloudFormation aún no están implementados. |
| `.gitignore` raíz | Cumple | Se agregó `.gitignore` raíz para artefactos Java, Angular, Node y secretos locales. |
| Estado entregable GitHub | Parcial | Deben quedar commits organizados, pruebas reproducibles y documentación actualizada. |

## 4. Evidencia de validación local

### Frontend

- `npm run build`: exitoso.
- El bundle genera una advertencia porque supera el presupuesto inicial de Angular.
- Las pruebas Angular existentes deben ejecutarse con `npm test`.

### Backend

- `mvn test`: validado con Java 25.
- Prueba de contexto Spring: 1 prueba exitosa.
- `OrdenServiceTest`: 2 pruebas exitosas.
- `AzureJwtAuthenticationConverterTest`: 3 pruebas exitosas.
- `SecurityMockMvcTest`: 3 pruebas exitosas.
- El proyecto declara Java 25 en `pedidos360-backend/pom.xml`; se debe mantener la misma versión en el entorno de entrega.

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

Requisitos: Java 25 y Maven 3.9 o superior.

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
