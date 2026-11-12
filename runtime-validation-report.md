# Informe de validación de ejecución — Pedidos360

**Fecha:** 12 de noviembre de 2026
**Alcance:** preparación local para la Evaluación Parcial 5, conservando la validación del flujo RabbitMQ.

## Resultados

| Área | Verificación | Resultado |
|---|---|---|
| Backend | `.\pedidos360-backend\mvnw.cmd -f pedidos360-backend\pom.xml test` | Correcto: 32 pruebas, sin fallos ni errores. Incluye E2E HTTP para clientes, productos y órdenes. |
| RabbitMQ Admin | `mvn.cmd -f pedidos360-rabbitmq-admin\pom.xml clean test` | Correcto: 7 pruebas, sin fallos ni errores. |
| Kafka Admin | `mvn.cmd -f pedidos360-kafka-admin\pom.xml test` | Correcto: 10 pruebas, sin fallos ni errores. |
| Frontend unitario | `npm.cmd test -- --watch=false` | Correcto: 2 pruebas. |
| Frontend navegador | `npm.cmd run test:e2e` | Correcto: 3 pruebas de Playwright. |
| Build Angular | `npm.cmd run build` | Correcto. El bundle inicial mide 693.64 kB y supera el presupuesto configurado de 500 kB por 193.64 kB. |
| RabbitMQ | Estado de Docker y `rabbitmq-diagnostics cluster_status` | Correcto: dos nodos activos en el clúster, sin particiones; ambos contenedores están saludables. |
| Backend en Docker | `GET http://localhost:8080/actuator/health` | Correcto: `{"status":"UP"}`. |
| Kafka | `kafka-broker-api-versions` en la red interna de Docker | Correcto: los brokers 1, 2 y 3 responden. |
| Replicación Kafka | Descripción de `pedidos360.orders.created` | Correcto: 3 particiones, factor de replicación 3, todas las réplicas en ISR. |
| Evento Kafka real | Lectura con `kafka-console-consumer` de `pedidos360.orders.created` | Correcto: se leyó un evento de orden publicado por la prueba API. |
| Consolas/servicios web | Kafka UI (`8085`) y APIs administrativas sin token | Kafka UI responde `200`; RabbitMQ Admin (`8081`) y Kafka Admin (`8082`) responden `401` sin token, conforme a su protección. |

## Cobertura añadida

- Se incorporaron tres pruebas E2E de backend que crean, consultan, modifican y eliminan clientes/productos; verifican autenticación y autorización; y ejercitan la creación de una orden, su persistencia, el descuento de inventario y la publicación Kafka.
- Las pruebas de navegador cubren la pantalla de inicio, el acceso denegado y la recuperación ante una ruta desconocida.
- Las pruebas E2E del backend usan H2 y tokens JWT simulados para evaluar las rutas y roles. No representan un inicio de sesión real en Azure AD.
- Se aprovisionaron localmente los tópicos `pedidos360.orders.created` y `pedidos360.orders.notifications` con tres particiones y factor de replicación tres. En una instalación limpia, cree los tópicos antes de probar la publicación si el auto-create sigue deshabilitado.

## Pendientes o límites para la demostración

1. No se verificó inicio de sesión real con Azure AD porque no se dispone de credenciales de evaluación. Las APIs administrativas requieren un bearer token válido con rol `ADMIN`.
2. No se realizó despliegue ni validación de recursos cloud; la evidencia corresponde al entorno Docker local.
3. La compilación Angular termina correctamente, pero queda la advertencia del presupuesto del bundle inicial indicada arriba.
4. Docker Compose permanece iniciado para facilitar la demostración local. Los servicios pueden detenerse cuando ya no se necesiten con `docker compose down` en sus respectivos archivos Compose.
