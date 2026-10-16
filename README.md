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

Al confirmar una orden, el backend publica tareas asíncronas para notificaciones, tickets y documentos. Cada dominio tiene un consumidor, una cola durable y su propia DLQ. Los consumidores usan ACK/NACK manual; el servicio RabbitMQ Admin expone una API REST protegida para administrar la topología. Los consumidores de esta entrega validan y registran las solicitudes en logs; no envían correo ni generan archivos externos.

### 📋 Matriz de Cumplimiento de la Rúbrica (Evaluación Parcial N.° 3)

| Indicador de Evaluación | Ponderación | Nivel de Desempeño | Evidencia / Ubicación en el Código |
|---|:---:|:---:|---|
| **Mensajería local** | Exchanges, colas, bindings y DLQ por dominio | Configurados en `pedidos360-backend/src/main/java/cl/duoc/pedidos360/messaging/RabbitMessagingConfiguration.java`. | **Implementado; pruebas unitarias** |
| **Consumidores** | Notificaciones, tickets y documentos con ACK/NACK | `OrdenNotificacionConsumer`, `OrdenTicketConsumer` y `OrdenDocumentoConsumer`. | **Implementado; procesa y registra solicitudes** |
| **Administración RabbitMQ** | Endpoints REST para colas, exchanges y bindings | `pedidos360-rabbitmq-admin`, con autenticación JWT y rol `ADMIN`. | **Implementado; pruebas web/servicio** |
| **Clúster RabbitMQ local** | Dos nodos configurados con descubrimiento clásico | `compose.yaml` y `infrastructure/rabbitmq/rabbitmq.conf`. | **Configurado; requiere validar con Docker activo** |
| **Despliegue cloud** | API Gateway, frontend/backend activos, IDaaS y RabbitMQ en nube | Existe una URL de API Gateway configurada; no se pudieron verificar credenciales AWS ni los demás recursos desde este entorno. | **Pendiente de verificación en AWS** |

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
         | 2. OrderEventPublisher.publishCreated(orden)
         v
 [TopicExchange: 'pedidos360.orders']
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
* **`pedidos360.orders` (Topic Exchange, durable):** Intercambiador principal de eventos de dominio de órdenes. Permite enrutar selectivamente a distintos microservicios/consumidores suscritos.
* **`pedidos360.dead-letter` (Direct Exchange, durable):** Intercambiador de letra muerta (DLX). Recibe mensajes rechazados de forma determinista hacia colas de auditoría de fallas.

### 3.2 Colas Principales y DLQs

| Dominio | Cola durable | Routing key | DLQ |
|---|---|---|---|
| Notificaciones | `pedidos360.order-notifications` | `order.created.notifications` | `pedidos360.order-notifications.dlq` |
| Tickets | `pedidos360.order-tickets` | `order.created.tickets` | `pedidos360.order-tickets.dlq` |
| Documentos | `pedidos360.order-documents` | `order.created.documents` | `pedidos360.order-documents.dlq` |

Cada cola principal configura `x-dead-letter-exchange=pedidos360.dead-letter` y su routing key DLQ correspondiente.

---

## 4. Microservicio Administrador de RabbitMQ (API REST)

Los administradores del sistema (`ROLE_ADMIN`) cuentan con una API REST para gestionar la topología en tiempo de ejecución:

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

Pruebas automatizadas disponibles:

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

---

## 6. Puesta en Marcha

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
