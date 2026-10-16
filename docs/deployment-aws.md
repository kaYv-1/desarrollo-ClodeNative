# Despliegue AWS

Este documento describe el despliegue objetivo exigido por la pauta. Los pasos que requieren una cuenta AWS, una VPC y dominios reales quedan marcados como ejecución pendiente.

## Arquitectura objetivo

```text
Angular SPA -> AWS API Gateway HTTP API -> VPC Link -> Network Load Balancer -> EC2 -> Spring Boot
                                                                   |
                                                                   -> PostgreSQL administrado o RDS
```

API Gateway debe ser el único endpoint público de la API. El puerto 8080 de EC2 no debe exponerse a Internet; el Security Group debe permitir tráfico únicamente desde el balanceador.

## 1. Construir la imagen

Desde `pedidos360-backend/`:

```bash
docker build -t pedidos360-backend:latest .
docker save pedidos360-backend:latest -o pedidos360-backend.tar
```

La imagen no contiene secretos. El perfil productivo obtiene las credenciales desde variables de entorno o AWS Secrets Manager.

## 2. Preparar EC2

1. Crear una instancia EC2 con una distribución compatible con Docker.
2. Configurar un Security Group que permita SSH solo desde la IP administrativa.
3. Permitir el puerto de health check únicamente desde el balanceador.
4. Instalar Docker y cargar la imagen.
5. Ejecutar el backend con el perfil PostgreSQL:

```bash
docker load -i pedidos360-backend.tar
docker run -d --name pedidos360-backend --restart unless-stopped \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=postgres \
  -e SPRING_DATASOURCE_URL="$SPRING_DATASOURCE_URL" \
  -e SPRING_DATASOURCE_USERNAME="$SPRING_DATASOURCE_USERNAME" \
  -e SPRING_DATASOURCE_PASSWORD="$SPRING_DATASOURCE_PASSWORD" \
  -e AZURE_ISSUER_URI="$AZURE_ISSUER_URI" \
  -e AZURE_API_AUDIENCE="$AZURE_API_AUDIENCE" \
  pedidos360-backend:latest
```

Health check local: `http://localhost:8080/actuator/health`.

## 3. API Gateway

1. Crear un Network Load Balancer interno o público según la topología de la VPC.
2. Registrar la instancia EC2 como target en el puerto 8080.
3. Crear un VPC Link desde API Gateway al balanceador.
4. Crear una HTTP API con rutas `/api/{proxy+}` y métodos necesarios.
5. Configurar la integración hacia el VPC Link.
6. Configurar un JWT Authorizer con:
   - Issuer: `https://login.microsoftonline.com/<TENANT_ID>/v2.0`
   - Audience: `api://<API_CLIENT_ID>`
   - Claim de scopes: `scp`
7. Asociar el authorizer a las rutas protegidas.
8. Mantener la autorización por roles en Spring Security; API Gateway valida el JWT, pero no reemplaza `@PreAuthorize`.
9. Configurar CORS para el dominio real del frontend.

## 4. PostgreSQL

Usar RDS PostgreSQL o un servicio administrado equivalente. Crear la base, restringir el Security Group al backend y configurar:

```text
SPRING_PROFILES_ACTIVE=postgres
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:5432/pedidos360
SPRING_DATASOURCE_USERNAME=<secret>
SPRING_DATASOURCE_PASSWORD=<secret>
```

No subir credenciales al repositorio. El perfil PostgreSQL usa `ddl-auto=validate`, por lo que la estructura debe gestionarse mediante migraciones antes del despliegue productivo.

## 5. Frontend

El frontend debe cambiar `apiEndpoint` desde `http://localhost:8080` a la URL pública de API Gateway. También se debe registrar esa URL como redirect URI SPA en Microsoft Entra ID y agregarla a CORS del backend cuando corresponda.

## Estado

- Dockerfile: agregado al repositorio.
- Guía de arquitectura y despliegue: documentada.
- Cuenta AWS, EC2, API Gateway, VPC Link, balanceador y RDS: requieren provisionamiento real.

## 6. RabbitMQ local y productivo

El `compose.yaml` de la raíz levanta dos nodos RabbitMQ con descubrimiento clásico de pares, el backend y el servicio administrador. Comprueba la formación del clúster antes de grabar la demostración:

```powershell
docker compose up --build -d
docker compose exec rabbitmq1 rabbitmqctl cluster_status
```

Los nodos tienen consolas en `http://localhost:15672` y `http://localhost:15673`. Las credenciales `pedidos360` / `pedidos360-local` son solo para desarrollo. La topología declara el Topic Exchange `pedidos360.orders`, tres colas principales —notificaciones, tickets y documentos— y tres DLQs, enlazadas al Direct Exchange `pedidos360.dead-letter`. Los consumidores registran las solicitudes en logs, ACK ante datos válidos y NACK sin requeue ante mensajes inválidos.

La configuración local de dos nodos no crea por sí sola un clúster RabbitMQ en AWS. En producción deben desplegarse y configurarse al menos dos nodos alcanzables entre sí, con el mismo Erlang cookie, resolución DNS estable, puertos Erlang abiertos entre nodos, almacenamiento persistente y credenciales gestionadas por secretos. Configure `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USERNAME` y `RABBITMQ_PASSWORD` para las aplicaciones.

El microservicio administrador expone estas operaciones para usuarios `ADMIN`:

- `POST/DELETE /api/admin/rabbitmq/queues`
- `POST/DELETE /api/admin/rabbitmq/exchanges`
- `POST/DELETE /api/admin/rabbitmq/bindings`

Los endpoints reciben DTO validados y delegan la operación en `RabbitAdminService`.

## 7. Lista de verificación de la presentación

La configuración del repositorio no prueba que los recursos administrados estén desplegados. Antes de presentar, verifica y captura evidencia de:

- API Gateway HTTP API, rutas, integración al backend y JWT authorizer funcionando con token inválido y válido.
- Tenant IDaaS y usuarios registrados; login OIDC desde el frontend y Access Token válido.
- Frontend y backend publicados y activos; navegador llamando a la API mediante API Gateway.
- Dos nodos RabbitMQ en cloud y estado de clúster que muestre ambos nodos.
- Tres colas principales y tres DLQ; generar un error controlado y comprobar que el mensaje llega a la DLQ correspondiente.
- Exchanges Topic y Direct, bindings y ejecución de Docker Compose en la nube.
- Presentación de 5 a 10 minutos con evidencia visual del flujo completo.

La URL API Gateway está configurada en `pedidos360-frontend/public/runtime-config.json`. La cuenta AWS, recursos desplegados, estado del clúster y autenticación cloud requieren comprobación en la consola de AWS; no se consideran verificados solamente por esa URL.