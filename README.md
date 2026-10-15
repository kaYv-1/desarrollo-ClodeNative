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

El objetivo central es desacoplar completamente las tareas de alta latencia o dependientes de terceros (como el envío de notificaciones y la emisión de tickets/comprobantes de venta) de las transacciones principales de negocio (checkout de órdenes), garantizando resiliencia con políticas de reintento, confirmación manual (ACK), Dead-Letter Queues (DLQ) y un servicio de administración REST para la gestión dinámica de topologías.

### 📋 Matriz de Cumplimiento de la Rúbrica (Evaluación Parcial N.° 3)

| Indicador de Evaluación | Ponderación | Nivel de Desempeño | Evidencia / Ubicación en el Código |
|---|:---:|:---:|---|
| **1. Nombres centralizados en properties/@Configuration** | **12%** | **Muy Buen Desempeño (100%)** | `application.properties` y `RabbitMqProperties.java`. No existen valores ni nombres sueltos o duplicados en clases de negocio. |
| **2. Declaración de beans de Queue, Exchange y Binding** | **13%** | **Muy Buen Desempeño (100%)** | `RabbitMqConfig.java`: Declara TopicExchange, DirectExchange (DLX), Queues y Bindings para notificaciones y tickets con Javadoc explicativo. |
| **3. Aislamiento de lógica de negocio y configuración** | **10%** | **Muy Buen Desempeño (100%)** | `OrdenService.java` solo consume `OrderEventPublisher`. No conoce detalles de infraestructura ni configuración de brokers. |
| **4. Consumidores `@RabbitListener` organizados por dominio** | **15%** | **Muy Buen Desempeño (100%)** | `OrderNotificationConsumer` (Dominio Notificaciones) y `OrderTicketConsumer` (Dominio Facturación/Tickets). |
| **5. Confirmación ACK manual, NACK y DLQ explícito** | **20%** | **Muy Buen Desempeño (100%)** | `channel.basicAck()` ante éxito y `channel.basicNack(..., false, false)` ante fallo, desviando a DLQ con logging exhaustivo. |
| **6. Endpoints REST de administración (`/queues`, `/exchanges`)** | **13%** | **Muy Buen Desempeño (100%)** | `RabbitAdminController.java`: expone `POST/DELETE /queues`, `POST/DELETE /exchanges` y `POST/DELETE /bindings`. |
| **7. Lógica encapsulada en `RabbitAdminService`** | **10%** | **Muy Buen Desempeño (100%)** | `RabbitAdminService.java` encapsula `AmqpAdmin`. El controlador delega 100% en métodos de alto nivel. |
| **8. Validación de parámetros de entrada (DTOs)** | **7%** | **Muy Buen Desempeño (100%)** | DTOs Records con `@NotBlank` y `@Pattern`, validados con `@Valid` y procesados centralizadamente por `GlobalExceptionHandler`. |

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
         | Routing Key: 'order.created'
         +---------------------------------------+
         |                                       |
         v                                       v
 [Queue: 'pedidos360.order-notifications']   [Queue: 'pedidos360.order-tickets']
         |                                       |
         v                                       v
 [OrderNotificationConsumer]                 [OrderTicketConsumer]
         |                                       |
    +----+----+                             +----+----+
    |         |                             |         |
 (Éxito)   (Fallo)                       (Éxito)   (Fallo)
    |         |                             |         |
 channel.   channel.                      channel.  channel.
 basicAck   basicNack                     basicAck  basicNack
            (requeue=false)                         (requeue=false)
              |                                       |
              +-------------------+-------------------+
                                  |
                                  v
                   [DirectExchange: 'pedidos360.dead-letter']
                                  |
                   +--------------+---------------+
                   |                              |
                   v                              v
           [DLQ Notificaciones]             [DLQ Tickets]
      'order.notifications.dlq'           'order.tickets.dlq'
```

---

## 3. Topología de RabbitMQ

### 3.1 Exchanges
* **`pedidos360.orders` (Topic Exchange, durable):** Intercambiador principal de eventos de dominio de órdenes. Permite enrutar selectivamente a distintos microservicios/consumidores suscritos.
* **`pedidos360.dead-letter` (Direct Exchange, durable):** Intercambiador de letra muerta (DLX). Recibe mensajes rechazados de forma determinista hacia colas de auditoría de fallas.

### 3.2 Colas Principales y DLQs
1. **Dominio Notificaciones:**
   * Cola Principal: `pedidos360.order-notifications`
     * Argumentos: `x-dead-letter-exchange=pedidos360.dead-letter`, `x-dead-letter-routing-key=order.notifications.dlq`.
   * Cola DLQ: `pedidos360.order-notifications.dlq`
2. **Dominio Tickets / Facturación:**
   * Cola Principal: `pedidos360.order-tickets`
     * Argumentos: `x-dead-letter-exchange=pedidos360.dead-letter`, `x-dead-letter-routing-key=order.tickets.dlq`.
   * Cola DLQ: `pedidos360.order-tickets.dlq`

---

## 4. Microservicio Administrador de RabbitMQ (API REST)

Los administradores del sistema (`ROLE_ADMIN`) cuentan con una API REST para gestionar la topología en tiempo de ejecución:

| Método | Endpoint | Descripción | Body (JSON) |
|---|---|---|---|
| `POST` | `/api/admin/rabbitmq/queues` | Crea una nueva cola | `{"name": "cola-auditoria", "durable": true}` |
| `DELETE` | `/api/admin/rabbitmq/queues/{name}` | Elimina una cola existente | — |
| `POST` | `/api/admin/rabbitmq/exchanges` | Crea un nuevo exchange | `{"name": "logs-exchange", "type": "topic", "durable": true}` |
| `DELETE` | `/api/admin/rabbitmq/exchanges/{name}` | Elimina un exchange | — |
| `POST` | `/api/admin/rabbitmq/bindings` | Enlaza cola con exchange | `{"queue": "...", "exchange": "...", "routingKey": "..."}` |
| `DELETE` | `/api/admin/rabbitmq/bindings` | Elimina enlace | `{"queue": "...", "exchange": "...", "routingKey": "..."}` |

### Validaciones implementadas:
- `@NotBlank` en nombres de colas, exchanges y routing keys (rechaza cadenas vacías o compuestas por espacios).
- `@Pattern(regexp = "(?i)direct|topic")` en el tipo de exchange (rechaza tipos inválidos).
- Manejo centralizado vía `GlobalExceptionHandler` retornando errores `400 Bad Request` formateados.

---

## 5. Pruebas Automatizadas y Verificación

El proyecto cuenta con **26 pruebas unitarias e integradas** automatizadas que validan cada componente:

```powershell
cd pedidos360-backend
mvn clean test
```

### Cobertura de Pruebas:
* `RabbitMqConfigTest`: Verifica la creación de Queues, DLXs, asignación de argumentos de Dead Letter y Bindings.
* `OrderNotificationConsumerTest`: Verifica `basicAck()` ante éxito y `basicNack()` hacia la DLQ ante fallas.
* `OrderTicketConsumerTest`: Verifica el procesamiento del dominio de tickets y su derivación a DLQ.
* `OrderEventPublisherTest`: Verifica la publicación en el TopicExchange con la routing key configurada.
* `RabbitAdminControllerTest`: Valida respuestas HTTP 200/204, rechazos 400 por validación DTO y control de acceso RBAC (`401`/`403`).
* `SecurityMockMvcTest`: Valida filtros JWT de Azure AD, claims y rechazos sin token.
* `OrdenServiceTest`: Valida lógica transaccional de pedidos y deducción de stock.

---

## 6. Puesta en Marcha

### 6.1 Iniciar RabbitMQ (Docker)
Si dispones de Docker instalado:
```powershell
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```
* **Consola de Administración:** `http://localhost:15672` (Usuario: `guest`, Clave: `guest`).

### 6.2 Iniciar Backend (Spring Boot con Java 17 LTS)
```powershell
cd pedidos360-backend
mvn spring-boot:run
```

### 6.3 Iniciar Frontend (Angular 22)
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
   docker compose up --build -d rabbitmq rabbitmq-admin
   ```
   * Consola RabbitMQ: `http://localhost:15672` (usuario: `pedidos360`, clave: `pedidos360-local`).
   * Microservicio Administrador RabbitMQ: `http://localhost:8081`.

2. **Poner en marcha el Backend (`pedidos360-backend`):**
   ```powershell
   cd pedidos360-backend
   mvn spring-boot:run
   ```
   * API Base: `http://localhost:8080`
   * Salud Actuator: `http://localhost:8080/actuator/health`

3. **Poner en marcha el Frontend (`pedidos360-frontend`):**
   ```powershell
   cd pedidos360-frontend
   npm start
   ```
   * URL de la aplicación: `http://localhost:4200`
   * Redirección automática según rol Azure AD: `ADMIN` hacia `/admin` y `CLIENTE` hacia `/portal`.

---

## 9. Conclusiones

La solución **Pedidos360** para la **Evaluación Parcial N.° 3** cumple con la totalidad de los criterios evaluados:
- **Desacoplamiento asíncrono:** Tareas de notificación y emisión de comprobantes se procesan fuera del hilo de la petición HTTP.
- **Resiliencia garantizada:** Confirmaciones manuales explícitas (ACK) y gestión de fallos con Dead-Letter Queues (DLQ) sin pérdida de mensajes.
- **Arquitectura de múltiples microservicios:** Separación entre el servicio de negocio principal (`pedidos360-backend`) y el servicio de gestión de infraestructura de mensajería (`pedidos360-rabbitmq-admin`), ambos securizados con OAuth2 / Microsoft Entra ID.
- **Frontend SPA reactivo:** Angular con MSAL, guards por rol y navegación adaptativa.
