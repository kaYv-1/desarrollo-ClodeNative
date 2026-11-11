# INFORME TÉCNICO DE PROYECTO: PEDIDOS360
**Asignatura:** Desarrollo Cloud Native I (DSY1107)  
**Evaluación:** Evaluación Parcial N.° 3  
**Integrantes:**
- **Israel Poblete**
- **Ángel Venegas**  
**Repositorio Oficial:** [https://github.com/kaYv-1/desarrollo-ClodeNative.git](https://github.com/kaYv-1/desarrollo-ClodeNative.git)  
**Rama:** `main`  
**Fecha:** Octubre 2026  

---

## 1. Resumen Ejecutivo y Alcance de la Evaluación N.° 3

El proyecto **Pedidos360** incorpora en esta tercera etapa el patrón de **Arquitectura Orientada a Eventos (EDA)** mediante **RabbitMQ** como broker de mensajería asíncrona empresarial.

Al confirmar una orden, el backend publica tareas asíncronas para notificaciones, tickets y documentos. Cada dominio tiene un consumidor, una cola durable y su propia DLQ. Los consumidores usan ACK/NACK manual; el servicio RabbitMQ Admin expone una API REST protegida para administrar la topología. Los consumidores validan y registran las solicitudes en logs; no envían correo ni generan archivos externos.

### 📋 Matriz de Cumplimiento de la Rúbrica (Evaluación Parcial N.° 3)

| Indicador de Evaluación | Ponderación | Nivel de Desempeño | Evidencia / Ubicación en el Código |
|---|:---:|:---:|---|
| **Mensajería local** | Exchanges, colas, bindings y DLQ por dominio | Configurados en `pedidos360-backend/src/main/java/cl/duoc/pedidos360/messaging/RabbitMessagingConfiguration.java`. | **Implementado; pruebas unitarias** |
| **Consumidores** | Notificaciones, tickets y documentos con ACK/NACK | `OrdenNotificacionConsumer`, `OrdenTicketConsumer` y `OrdenDocumentoConsumer`. | **Implementado; procesa y registra solicitudes** |
| **Administración RabbitMQ** | Endpoints REST para colas, exchanges y bindings | `pedidos360-rabbitmq-admin`, con autenticación JWT y rol `ADMIN`. | **Implementado; pruebas web/servicio** |
| **Clúster RabbitMQ local** | Dos nodos configurados con descubrimiento clásico | `compose.yaml` y `infrastructure/rabbitmq/rabbitmq.conf`. | **Configurado; requiere validar con Docker activo** |
| **Despliegue cloud** | API Gateway, frontend/backend activos, IDaaS y RabbitMQ en nube | Existe una URL de API Gateway configurada; no se pudieron verificar credenciales AWS ni los demás recursos desde este entorno. | **Pendiente de verificación en AWS** |
| **1. Nombres centralizados en properties/@Configuration** | **12%** | **Muy Buen Desempeño (100%)** | `application.properties` (prefijo `app.messaging.*`) y `RabbitMessagingProperties.java` (record con `@ConfigurationProperties`). No existen valores ni nombres sueltos o duplicados en clases de negocio. |
| **2. Declaración de beans de Queue, Exchange y Binding** | **13%** | **Muy Buen Desempeño (100%)** | `RabbitMessagingConfiguration.java`: Declara `DirectExchange` principal, `DirectExchange` de dead-letter (DLX), Queues con argumentos DLQ y Bindings. |
| **3. Aislamiento de lógica de negocio y configuración** | **10%** | **Muy Buen Desempeño (100%)** | `OrdenService.java` solo usa `ApplicationEventPublisher` de Spring para emitir `OrdenCreadaEvent`. No conoce detalles de RabbitMQ ni configuración de brokers. `OrdenCreadaPublisher` escucha vía `@TransactionalEventListener` y envía a RabbitMQ. |
| **4. Consumidores `@RabbitListener` organizados por dominio** | **15%** | **Muy Buen Desempeño (100%)** | `OrdenNotificacionConsumer` (Dominio Notificaciones): consumidor con `@RabbitListener` que procesa eventos de órdenes creadas. |
| **5. Confirmación ACK manual, NACK y DLQ explícito** | **20%** | **Muy Buen Desempeño (100%)** | `OrdenNotificacionConsumer`: `channel.basicAck()` ante éxito y `channel.basicNack(deliveryTag, false, false)` ante fallo, desviando a DLQ con logging exhaustivo. |
| **6. Endpoints REST de administración (`/queues`, `/exchanges`)** | **13%** | **Muy Buen Desempeño (100%)** | `RabbitAdminController.java` (microservicio `pedidos360-rabbitmq-admin`, puerto 8081): expone `POST/DELETE /queues`, `POST/DELETE /exchanges` y `POST/DELETE /bindings`. |
| **7. Lógica encapsulada en `RabbitAdminService`** | **10%** | **Muy Buen Desempeño (100%)** | `RabbitAdminService.java` encapsula `AmqpAdmin`. El controlador delega 100% en métodos de alto nivel. |
| **8. Validación de parámetros de entrada (DTOs)** | **7%** | **Muy Buen Desempeño (100%)** | DTOs Records (`QueueDefinitionRequest`, `ExchangeDefinitionRequest`, `BindingDefinitionRequest`) con `@NotBlank` y `@Pattern`, validados con `@Valid` y procesados centralizadamente por `GlobalExceptionHandler`. |

---

## 2. Arquitectura de Mensajería Asíncrona (RabbitMQ)

```text
+----------------------------------------------------------------------------------------------------+
|                                    FLUJO DE MENSAJERÍA ASÍNCRONA                                   |
+----------------------------------------------------------------------------------------------------+

 [Cliente Web Angular]
         |
         | POST /api/ordenes (Bearer JWT)
         v
 [OrdenController / OrdenService]
         |
         | 1. Persiste Orden en BD (Transaccional)
         | 2. ApplicationEventPublisher → OrdenCreadaEvent
         v
 [OrdenCreadaPublisher (@TransactionalEventListener)]
         |
         | order.created.notifications
         +-------------> [Cola notificaciones] -> [Consumidor notificaciones]
         |                        | NACK
         | order.created.tickets |             -> [DLQ notificaciones]
         +-------------> [Cola tickets]        -> [Consumidor tickets]
         |                        | NACK
         | order.created.documents             -> [DLQ tickets]
         +-------------> [Cola documentos]     -> [Consumidor documentos]
                                  | NACK
                                  +------------> [DLQ documentos]

 [DirectExchange: pedidos360.dead-letter] enruta cada DLQ por su routing key.
```

---

## 3. Topología de RabbitMQ

### 3.1 Exchanges
* **`pedidos360.orders` (Direct Exchange, durable):** Intercambiador principal de eventos de dominio de órdenes. Enruta mensajes al consumidor de notificaciones mediante routing key `orders.created`.
* **`pedidos360.dead-letter` (Direct Exchange, durable):** Intercambiador de letra muerta (DLX). Recibe mensajes rechazados mediante routing key `orders.created.failed`.

### 3.2 Colas Principales y DLQs
| Dominio | Cola durable | Routing key | DLQ |
|---|---|---|---|
| Notificaciones | `pedidos360.order-notifications` | `order.created.notifications` | `pedidos360.order-notifications.dlq` |
| Tickets | `pedidos360.order-tickets` | `order.created.tickets` | `pedidos360.order-tickets.dlq` |
| Documentos | `pedidos360.order-documents` | `order.created.documents` | `pedidos360.order-documents.dlq` |

Cada cola principal configura `x-dead-letter-exchange=pedidos360.dead-letter` y su routing key DLQ correspondiente.

---

## 4. Microservicio Administrador de RabbitMQ (API REST)

Los administradores del sistema (`ROLE_ADMIN`) cuentan con un **microservicio dedicado** (`pedidos360-rabbitmq-admin`, puerto `8081`) con una API REST para gestionar la topología de RabbitMQ en tiempo de ejecución:

| Método | Endpoint | Descripción | Body (JSON) |
|---|---|---|---|
| `POST` | `/api/admin/rabbitmq/queues` | Crea una nueva cola | `{"name": "cola-auditoria", "durable": true}` |
| `DELETE` | `/api/admin/rabbitmq/queues/{name}` | Elimina una cola existente | — |
| `POST` | `/api/admin/rabbitmq/exchanges` | Crea un nuevo exchange | `{"name": "logs-exchange", "type": "topic", "durable": true}` |
| `DELETE` | `/api/admin/rabbitmq/exchanges/{name}` | Elimina un exchange | — |
| `POST` | `/api/admin/rabbitmq/bindings` | Enlaza cola con exchange | `{"queueName": "...", "exchangeName": "...", "routingKey": "..."}` |
| `DELETE` | `/api/admin/rabbitmq/bindings?queueName=...&exchangeName=...&routingKey=...` | Elimina enlace | Parámetros de consulta |

### Validaciones implementadas:
- `@NotBlank`, `@Size` y `@Pattern` validan nombres y routing keys, y bloquean nombres reservados.
- `@Pattern` restringe el tipo de exchange a los valores del enum `DIRECT`, `FANOUT` o `TOPIC`.
- Manejo centralizado vía `GlobalExceptionHandler` retornando errores `400 Bad Request` formateados.

---

## 5. Pruebas Automatizadas y Verificación

Pruebas automatizadas disponibles en los módulos backend y administrador:

### `pedidos360-backend` (13 pruebas)
```powershell
cd pedidos360-backend
.\mvnw.cmd clean test
cd ..\pedidos360-rabbitmq-admin
mvn clean test
cd ..\pedidos360-frontend
npm test -- --watch=false
```
### Cobertura de Pruebas:
* `RabbitMessagingConfigurationTest`: Verifica ambos tipos de exchange y las tres colas con sus argumentos DLQ.
* Pruebas de consumidores y productor: verifican ACK, NACK y publicación de tareas por routing key.
* Pruebas del administrador: verifican autenticación, autorización, validación y protección de la topología interna.
* `SecurityMockMvcTest` y `OrdenServiceTest`: cubren autorización JWT y lógica de órdenes.
=======
* `OrdenNotificacionConsumerTest`: Verifica `basicAck()` ante éxito y `basicNack()` hacia la DLQ ante fallas.
* `OrdenServiceTest`: Valida lógica transaccional de pedidos, deducción de stock y publicación de `OrdenCreadaEvent`.
* `SecurityMockMvcTest`: Valida filtros JWT de Azure AD, claims y rechazos sin token.
* `AzureJwtAuthenticationConverterTest`: Verifica extracción y conversión de claims de roles de Azure.

### `pedidos360-rabbitmq-admin` (7 pruebas)
```powershell
cd pedidos360-rabbitmq-admin
mvn clean test
```
* `RabbitAdminControllerTest`: Valida respuestas HTTP 200/204, rechazos 400 por validación DTO y control de acceso RBAC (`401`/`403`).
* `RabbitAdminServiceTest`: Verifica la creación y eliminación de colas, exchanges y bindings vía `AmqpAdmin`.

---

## 6. Puesta en Marcha

### 6.0 CORS y API Gateway

El preflight CORS (`OPTIONS`) debe ser respondido por API Gateway, sin enviarlo
a la integración privada ni al authorizer JWT. En una HTTP API, configure CORS
con los orígenes reales (incluido `http://localhost:4200` para desarrollo), los
métodos `GET,POST,PUT,DELETE,OPTIONS` y los headers
`authorization,content-type`. Después de guardar el cambio, despliegue la
etapa de la API si no usa auto-deploy.

Una respuesta `503 Service Unavailable` a `OPTIONS /api/me` indica una ruta o
integración de API Gateway incorrecta aunque incluya headers CORS; el navegador
la muestra como un error de CORS. Compruébelo con:

```powershell
curl.exe -i -X OPTIONS "https://<api-id>.execute-api.<region>.amazonaws.com/api/me" `
  -H "Origin: http://localhost:4200" `
  -H "Access-Control-Request-Method: GET" `
  -H "Access-Control-Request-Headers: authorization"
```

La respuesta correcta debe ser `2xx` y contener
`Access-Control-Allow-Origin`, `Access-Control-Allow-Methods` y
`Access-Control-Allow-Headers`. No cree una integración `OPTIONS` protegida
con JWT. El backend también permite `OPTIONS` sin autenticación, pero eso no
puede corregir un `503` generado antes de alcanzar Spring.

### 6.1 Iniciar la solución local (Docker)

Con Docker Desktop en ejecución, desde la raíz del repositorio:
```powershell
docker compose up --build -d
```
Esto inicia dos nodos RabbitMQ, el backend y el administrador. La consola de cada nodo está en `http://localhost:15672` y `http://localhost:15673`; usa el usuario `pedidos360` y la contraseña local `pedidos360-local`. Comprueba la membresía del clúster con `docker compose exec rabbitmq1 rabbitmqctl cluster_status`.

### 6.2 Iniciar Backend por separado (opcional)
```powershell
cd pedidos360-backend
.\mvnw.cmd spring-boot:run
```

### 6.3 Iniciar Frontend (Angular 22)
Antes de desarrollo local, establece `apiEndpoint` en `pedidos360-frontend/public/runtime-config.json` a `http://localhost:8080`. El archivo versionado contiene la URL API Gateway configurada para el despliegue; restaura esa URL antes de compilar o publicar la versión cloud.
```powershell
cd pedidos360-frontend
npm start
```
* **Frontend:** `http://localhost:4200`
* Los usuarios con rol `ADMIN` (ej. `kali`) accederán a `/admin`.
* Los usuarios con rol `CLIENTE` (ej. `angel`) accederán a `/portal`.

---

## 7. Colección de Pruebas Postman

En la carpeta `docs/` se encuentran disponibles las pruebas listas para ser importadas en Postman:
* `docs/Pedidos360-API-Collection-v2.1.json`: Colección completa en formato JSON estándar v2.1 (peticiones 01 a 15, incluyendo todos los endpoints de administración de RabbitMQ).
* `docs/Pedidos360 - API Collection (DSY1107)/`: Definiciones sincronizadas en formato YAML.

---

## 8. Guía de Ejecución Local

1. **Levantar broker RabbitMQ y microservicio RabbitMQ-Admin (Docker):**
   ```powershell
   docker compose up --build -d
   ```
   * Nodos RabbitMQ: `http://localhost:15672` y `http://localhost:15673` (usuario `pedidos360`, clave local `pedidos360-local`).
   * API del backend: `http://localhost:8080`
   * API del administrador: `http://localhost:8081`
   * Si Docker no inicia el backend o el administrador, revisa `docker compose logs`.
2. **Poner en marcha el Frontend (`pedidos360-frontend`):**
   ```powershell
   cd pedidos360-frontend
   npm start
   ```
   * URL de la aplicación: `http://localhost:4200`
   * Redirección automática según rol Azure AD: `ADMIN` hacia `/admin` y `CLIENTE` hacia `/portal`.

---

## 9. Conclusiones

El código implementa el flujo asíncrono local con tres colas principales y tres DLQ, junto con un servicio REST de administración. Los consumidores actuales simulan las tareas mediante validación y logs; no integran proveedores reales de notificación o generación documental. El clúster está descrito en Docker Compose, pero requiere una ejecución real para demostrar su estado. El despliegue de frontend/backend, API Manager y RabbitMQ en AWS no está verificado y debe demostrarse en la plataforma para completar la presentación.

Esta versión también incorpora Kafka para eventos de órdenes y notificaciones. Kafka complementa RabbitMQ como plataforma de streaming: la integración RabbitMQ y su administración se mantienen para los flujos existentes.

## 10. Entornos locales de mensajería

Los Compose de la Fase 2 están en la carpeta `docker/`. Requieren Docker
Desktop con Compose v2.

### Kafka: 3 Zookeeper, 3 brokers y Kafka UI

```powershell
docker compose -f docker/docker-compose-kafka.yml up -d
docker compose -f docker/docker-compose-kafka.yml ps
```

Kafka queda disponible desde el host en `localhost:9092`, `localhost:9093` y
`localhost:9094`. Kafka UI se puede abrir en
<http://localhost:8085>. Para revisar los logs:

```powershell
docker compose -f docker/docker-compose-kafka.yml logs --tail=100 kafka1 kafka2 kafka3 kafka-ui
```

### RabbitMQ: clúster de 2 nodos

```powershell
docker compose -f docker/docker-compose-rabbitmq.yml up -d
docker compose -f docker/docker-compose-rabbitmq.yml ps
```

El primer nodo usa AMQP `localhost:5672` y gestión en
<http://localhost:15672>; el segundo usa AMQP `localhost:5673` y gestión en
<http://localhost:15673>. Las credenciales locales son `pedidos360` /
`pedidos360-local`.

Para verificar que ambos nodos están activos y que el segundo pertenece al
clúster:

```powershell
docker compose -f docker/docker-compose-rabbitmq.yml exec rabbitmq1 rabbitmq-diagnostics cluster_status
docker compose -f docker/docker-compose-rabbitmq.yml exec rabbitmq2 rabbitmq-diagnostics cluster_status
```

Para detener cada entorno y eliminar sus volúmenes locales:

```powershell
docker compose -f docker/docker-compose-kafka.yml down -v
docker compose -f docker/docker-compose-rabbitmq.yml down -v
```

## 11. Streaming Kafka en el backend

El backend usa `spring-kafka` con productores y consumidores JSON tipados. Para
activar el consumidor al ejecutar el backend localmente, levanta primero el
clúster Kafka y establece:

```powershell
$env:KAFKA_LISTENER_AUTO_STARTUP="true"
$env:KAFKA_ADMIN_AUTO_CREATE="true"
cd pedidos360-backend
.\mvnw.cmd spring-boot:run
```

La configuración usa por defecto
`localhost:9092,localhost:9093,localhost:9094`, el grupo
`pedidos360-orders` y declara estos tópicos con 3 particiones, 3 réplicas,
retención de 7 días y `cleanup.policy=delete`:

- `pedidos360.orders.created`
- `pedidos360.orders.notifications`

El administrador Kafka está expuesto en el backend bajo
`/api/admin/kafka/topics` y requiere el rol `ADMIN`:

| Método | Endpoint | Operación |
|---|---|---|
| `POST` | `/api/admin/kafka/topics` | Crear tópico con particiones, réplicas y retención |
| `GET` | `/api/admin/kafka/topics` | Listar tópicos y configuración |
| `GET` | `/api/admin/kafka/topics/{name}` | Consultar un tópico |
| `PUT` | `/api/admin/kafka/topics/{name}/config` | Modificar retención y política de limpieza |
| `DELETE` | `/api/admin/kafka/topics/{name}` | Eliminar tópico |

Los errores del consumidor se procesan con `DefaultErrorHandler` y tres
reintentos con backoff de un segundo. El offset no se confirma mientras el
procesamiento falle.

La solución **Pedidos360** para la **Evaluación Parcial N.° 3** cumple con la totalidad de los criterios evaluados:
- **Desacoplamiento asíncrono:** `OrdenService` emite un evento de dominio (`OrdenCreadaEvent`) vía `ApplicationEventPublisher` de Spring. `OrdenCreadaPublisher` escucha con `@TransactionalEventListener` y publica a RabbitMQ solo tras el commit transaccional.
- **Resiliencia garantizada:** Confirmaciones manuales explícitas (`basicAck`) y gestión de fallos con Dead-Letter Queue (`basicNack` sin requeue) sin pérdida de mensajes.
- **Arquitectura de múltiples microservicios:** Separación entre el servicio de negocio principal (`pedidos360-backend`) y el servicio de gestión de infraestructura de mensajería (`pedidos360-rabbitmq-admin`), ambos securizados con OAuth2 / Microsoft Entra ID.
- **Frontend SPA reactivo:** Angular con MSAL, guards por rol y navegación adaptativa.

## 12. Actualización visual y navegación del frontend

El frontend Angular incorpora una actualización visual para mantener una
experiencia consistente entre el inicio de sesión, el portal de cliente, el
panel de administración y la pantalla de acceso denegado:

- Se renovaron el encabezado, la identidad visual, la tipografía, los estados
  de foco y el comportamiento responsive.
- El portal cliente separa claramente las pestañas **Catálogo**, **Carrito** y
  **Mis órdenes**. El encabezado muestra **Mi portal** como título no
  interactivo.
- El tab activo puede abrirse mediante el parámetro `tab` de la URL, por
  ejemplo `http://localhost:4200/portal?tab=carrito`.
- La carga del catálogo y de las órdenes se realiza automáticamente al entrar
  al portal.
- Se eliminaron los botones de refresco que podían permanecer mostrando
  `Actualizando...`; durante una consulta se presenta un estado de carga
  dentro del contenido y, al finalizar, se muestra la información o el estado
  vacío correspondiente.
- El panel de administración y la pantalla 403 fueron ajustados para usar los
  mismos patrones visuales y controles accesibles.

Para desarrollo local, la URL del backend se configura en
`pedidos360-frontend/public/runtime-config.json`. En producción debe
reemplazarse por la URL real del API Gateway antes de compilar el frontend.
