# INFORME TÉCNICO DE PROYECTO: PEDIDOS360
**Asignatura:** Desarrollo Cloud Native I (DSY1107)  
**Evaluación:** Evaluaciones Parciales N.° 3 (RabbitMQ) y N.° 5 (Kafka)
**Integrantes:**
- **Israel Poblete**
- **Ángel Venegas**  
**Repositorio Oficial:** [https://github.com/kaYv-1/desarrollo-ClodeNative.git](https://github.com/kaYv-1/desarrollo-ClodeNative.git)  
**Rama:** `main`  
**Fecha:** Octubre 2026  

---

## 1. Resumen Ejecutivo y Alcance de las Evaluaciones N.° 3 y 5

El proyecto **Pedidos360** combina **RabbitMQ** para el procesamiento asíncrono de tareas de negocio con **Apache Kafka** para publicar y consumir eventos de órdenes mediante tópicos. Kafka complementa la integración RabbitMQ existente; no la reemplaza.

Al confirmar una orden, el backend publica tareas para notificaciones, tickets y documentos en RabbitMQ, con ACK/NACK manual y DLQ por dominio. También publica el evento tipado en los tópicos Kafka de órdenes creadas y notificaciones. Ambos consumidores Kafka validan y registran los eventos con grupos separados y reintentos ante errores. Los consumidores actuales registran las solicitudes; no envían correo ni generan archivos externos.

### 📋 Componentes y evidencia

| Componente | Implementación | Evidencia |
|---|---|---|
| RabbitMQ | Productor y tres consumidores por dominio; ACK/NACK, DLQ y logging | `pedidos360-backend/src/main/java/cl/duoc/pedidos360/messaging/` |
| Administración RabbitMQ | API protegida para crear y eliminar colas, exchanges y bindings | `pedidos360-rabbitmq-admin` |
| Clúster RabbitMQ | Compose de dos nodos | `docker/docker-compose-rabbitmq.yml` |
| Kafka | Productor y consumidores JSON tipados para ambos tópicos, con grupos separados y reintentos | `pedidos360-backend/src/main/java/cl/duoc/pedidos360/kafka/` |
| Administración Kafka | Microservicio protegido para consultar, crear, modificar y eliminar tópicos/configuración y gestionar consumer groups | `pedidos360-kafka-admin` |
| Kafka y Kafka UI | Compose de Zookeeper, tres brokers y Kafka UI | `docker/docker-compose-kafka.yml` |
| Frontend y autenticación | Angular con MSAL; API protegida con JWT y roles | `pedidos360-frontend/` y configuración de seguridad de Spring |
| Despliegue cloud | Configuración de API Gateway disponible; recursos cloud no verificados desde este entorno | `docs/deployment-aws.md` |

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

Pruebas automatizadas disponibles en los módulos Java y frontend:

### `pedidos360-backend` (29 pruebas)
```powershell
.\pedidos360-backend\mvnw.cmd -f pedidos360-backend\pom.xml clean test
```
### Cobertura de Pruebas:
* `RabbitMessagingConfigurationTest`: Verifica ambos tipos de exchange y las tres colas con sus argumentos DLQ.
* Pruebas de consumidores y productor: verifican ACK, NACK y publicación de tareas por routing key.
* Pruebas del administrador: verifican autenticación, autorización, validación y protección de la topología interna.
* `OrdenNotificacionConsumerTest`: Verifica `basicAck()` ante éxito y `basicNack()` hacia la DLQ ante fallas.
* `OrdenServiceTest`: Valida lógica transaccional de pedidos, deducción de stock y publicación de `OrdenCreadaEvent`.
* `SecurityMockMvcTest`: Valida filtros JWT de Azure AD, claims y rechazos sin token.
* `AzureJwtAuthenticationConverterTest`: Verifica extracción y conversión de claims de roles de Azure.
* Las pruebas `KafkaEventProducerServiceTest`, `KafkaOrderEventPublisherTest`, `KafkaOrderEventConsumerTest` y `KafkaOrderNotificationConsumerTest` cubren publicación y consumo Kafka.

### `pedidos360-rabbitmq-admin` (7 pruebas)
```powershell
.\pedidos360-backend\mvnw.cmd -f pedidos360-rabbitmq-admin\pom.xml test
```
* `RabbitAdminControllerTest`: Valida respuestas HTTP 200/204, rechazos 400 por validación DTO y control de acceso RBAC (`401`/`403`).
* `RabbitAdminServiceTest`: Verifica la creación y eliminación de colas, exchanges y bindings vía `AmqpAdmin`.

### `pedidos360-kafka-admin` (10 pruebas)
```powershell
.\pedidos360-backend\mvnw.cmd -f pedidos360-kafka-admin\pom.xml test
```
* `KafkaAdminControllerTest` y `KafkaAdminServiceTest`: cubren CRUD de tópicos/configuración y consulta/borrado de consumer groups.
* `KafkaAdminSecurityTest`: verifica JWT, rol `ADMIN` y validación de solicitudes.

### Frontend
```powershell
cd pedidos360-frontend
npm test -- --watch=false
```

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
docker compose -f docker/docker-compose-kafka.yml up -d --build
docker compose -f docker/docker-compose-kafka.yml ps
```

Kafka queda disponible desde el host en `localhost:9092`, `localhost:9093` y
`localhost:9094`. Kafka UI se puede abrir en
<http://localhost:8085>. El microservicio administrador Kafka queda en
<http://localhost:8082> y usa los brokers de la red interna. Para revisar los logs:

```powershell
docker compose -f docker/docker-compose-kafka.yml logs --tail=100 kafka1 kafka2 kafka3 kafka-ui kafka-admin
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

Después del commit de la orden, el productor publica el mismo evento JSON
tipado en ambos tópicos. Cada tópico tiene un consumidor con un grupo distinto:
`pedidos360-orders` y `pedidos360-notifications`. La configuración usa por
defecto `localhost:9092,localhost:9093,localhost:9094` y declara los dos
tópicos con 3 particiones, 3 réplicas, retención de 7 días y
`cleanup.policy=delete`:

- `pedidos360.orders.created`
- `pedidos360.orders.notifications`

El microservicio `pedidos360-kafka-admin`, incluido en el Compose de Kafka y
expuesto en `http://localhost:8082`, ofrece `/api/admin/kafka/topics` y
requiere el rol `ADMIN`:

| Método | Endpoint | Operación |
|---|---|---|
| `POST` | `/api/admin/kafka/topics` | Crear tópico con particiones, réplicas y retención |
| `GET` | `/api/admin/kafka/topics` | Listar tópicos y configuración |
| `GET` | `/api/admin/kafka/topics/{name}` | Consultar un tópico |
| `PUT` | `/api/admin/kafka/topics/{name}/config` | Modificar retención y política de limpieza |
| `DELETE` | `/api/admin/kafka/topics/{name}` | Eliminar tópico |
| `GET` | `/api/admin/kafka/topics/groups` | Listar consumer groups con estado y tópicos asignados |
| `GET` | `/api/admin/kafka/topics/groups/{groupId}` | Consultar un consumer group |
| `DELETE` | `/api/admin/kafka/topics/groups/{groupId}` | Eliminar un consumer group inactivo |

Los errores del consumidor se procesan con `DefaultErrorHandler`, tres
reintentos y backoff de un segundo. El auto-commit está deshabilitado y el
offset se confirma por registro; los fallos de procesamiento quedan en los
logs del consumidor/error handler. La creación automática de tópicos queda
deshabilitada por defecto y se habilita localmente con
`KAFKA_ADMIN_AUTO_CREATE=true`.

La arquitectura mantiene el flujo RabbitMQ de la Evaluación Parcial N.° 3 y suma
streaming Kafka para la Evaluación Parcial N.° 5. `OrdenService` emite el evento
de dominio solo después de confirmar la transacción; los publicadores RabbitMQ
y Kafka mantienen sus responsabilidades separadas. Los servicios
administradores validan JWT y rol `ADMIN`. La ejecución de los clústeres y el
despliegue cloud deben verificarse en el entorno de presentación.

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
