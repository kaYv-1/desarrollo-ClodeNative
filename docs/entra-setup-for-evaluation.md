# Configuración de Microsoft Entra ID para la evaluación

Esta guía configura el inicio de sesión de la SPA Angular y la autorización JWT
del backend Pedidos360. No crea recursos de hosting en Azure. El despliegue
descrito actualmente para la aplicación está documentado aparte en
[`deployment-aws.md`](./deployment-aws.md).

## Estado comprobado

- Tenant configurado actualmente en el proyecto:
  `77747a67-519b-49e8-a701-13c4e011672c`.
- Application/Client ID configurado para la SPA y la API:
  `cca6baa4-4933-4d00-b8a9-8c899dbfba57`.
- Scope delegado esperado:
  `api://cca6baa4-4933-4d00-b8a9-8c899dbfba57/access_as_user`.
- Issuer JWT esperado:
  `https://login.microsoftonline.com/77747a67-519b-49e8-a701-13c4e011672c/v2.0`.
- El portal se cambió al tenant del proyecto:
  `israelpoblete2019gmail.onmicrosoft.com`
  (`77747a67-519b-49e8-a701-13c4e011672c`).
- Se encontró el registro `Pedidos360-Frontend` con el Client ID esperado.
- La lista **Owners** del registro no tiene propietarios asignados.
- Se intentó asignar como propietarios de este registro a
  `rpg72megads@gmail.com` e `israel.poblete2019@gmail.com`. Microsoft Graph
  rechazó el cambio con `403 Authorization_RequestDenied` / `Insufficient
  privileges to complete the operation`. La sesión actual puede consultar la
  aplicación, pero no modificar sus propietarios ni su configuración.
- La extensión Azure no reporta suscripciones en el tenant. Eso no impide
  administrar el registro Entra, pero sí bloquea comprobar o desplegar recursos
  Azure bajo una suscripción.
- El nombre del dominio público del frontend y la URL pública final de la API
  aún deben confirmarse.

## Requisitos para el propietario

Para continuar, una cuenta que ya tenga permisos suficientes en este tenant
debe agregar a los usuarios del equipo como propietarios de la aplicación
`Pedidos360-Frontend`, o asignarles un rol administrativo limitado a
administración de aplicaciones. Es preferible el permiso por aplicación antes
que otorgar Global Administrator. No se necesitan permisos de Contributor
sobre una suscripción para editar un app registration.

Si el tenant no aparece en el selector de directorios, el administrador del
tenant debe invitar la cuenta como usuario invitado y asignar los permisos
mínimos requeridos. No se deben compartir contraseñas, códigos MFA, tokens ni
client secrets por chat o correo.

## Pasos en el centro de administración Entra

1. Abrir <https://entra.microsoft.com/> e ir a **Entra ID → App registrations**.
   Confirmar el tenant `77747a67-519b-49e8-a701-13c4e011672c`.
2. Abrir `Pedidos360-Frontend`
   (`cca6baa4-4933-4d00-b8a9-8c899dbfba57`) y seleccionar **Manage → Owners**.
3. En **Add owners**, buscar y asignar los usuarios que mantendrán la app:
   `rpg72megads@gmail.com` y `israel.poblete2019@gmail.com`. Si el portal
   rechaza la operación, la cuenta que la ejecuta debe ser activada/iniciada
   como un administrador de Entra con permiso para administrar registros de
   aplicaciones. No se requiere transferir la propiedad del tenant.
4. Una vez asignados los propietarios, el equipo puede continuar verificando
   y configurando esta aplicación. No crear duplicados.
5. En **Authentication**, agregar una plataforma **Single-page application
   (SPA)** con ambos redirect URI:
   - `http://localhost:4200` para la prueba local.
   - La URL HTTPS exacta del frontend publicado, una vez acordado el hosting.
   No crear un client secret para Angular.
6. En **Expose an API**, verificar:
   - Application ID URI:
     `api://cca6baa4-4933-4d00-b8a9-8c899dbfba57`
   - Scope delegado habilitado: `access_as_user`.
   - El scope puede consentirse por los usuarios de la organización, sujeto a
     la política del tenant.
7. En **App roles**, crear o verificar dos roles habilitados, asignables a
   **Users/Groups**, con valores exactos `ADMIN` y `CLIENTE`.
8. En **Enterprise applications → aplicación → Users and groups**, asignar las
   cuentas de prueba a sus roles. Preparar al menos un usuario `ADMIN` y uno
   `CLIENTE`; no compartir sus credenciales con el equipo.
9. Confirmar que el frontend registrado solicita el scope
   `api://cca6baa4-4933-4d00-b8a9-8c899dbfba57/access_as_user`, y que los access
   tokens para la API son v2. El backend espera los roles en el claim `roles`.
10. Guardar y entregar al equipo solo datos no secretos:
   - Tenant ID confirmado.
   - Client ID de la SPA y Client ID/Application ID URI de la API.
   - Scope y valores de roles configurados.
   - URL HTTPS del frontend y URL pública de la API.
   - Confirmación de qué usuario de prueba tiene cada rol, sin contraseñas.

La configuración fuente actual usa el mismo Client ID para SPA y API. Si el
propietario decide usar registros separados, compartir ambos IDs y el API
Application ID URI para adaptar la configuración del proyecto; no cambiar los
IDs del código hasta confirmarlos.

## Validación después del setup

1. Configurar `pedidos360-frontend/public/runtime-config.json` con la URL real
   de la API (sin credenciales ni tokens).
2. Confirmar que el origen del frontend está permitido por CORS en la API y en
   cualquier gateway/proxy delante del backend.
3. Iniciar sesión desde el frontend con el usuario `CLIENTE`: debe poder abrir
   el portal, y las operaciones administrativas deben responder `403`.
4. Iniciar sesión con el usuario `ADMIN`: debe poder abrir el panel y las
   rutas administrativas permitidas.
5. Verificar los códigos de autorización:
   - Sin bearer token: `401 Unauthorized`.
   - Token válido sin el rol exigido: `403 Forbidden`.
   - Token válido con el rol asignado: respuesta esperada de la API.
6. Verificar que la audiencia del token sea el Application ID URI de la API y
   que el issuer corresponda al tenant configurado.

## Si el equipo decide desplegar también en Azure

Eso es independiente del login Entra y cambia el destino cloud documentado del
proyecto. Antes de aprovisionar recursos, el propietario debe confirmar esa
decisión y proporcionar el **Subscription ID**, Resource Group (o autorización
para crear uno), región, presupuesto máximo y dominio esperado. No se desplegará
ni se incurrirá en costos hasta que estén definidos y validados esos datos.
