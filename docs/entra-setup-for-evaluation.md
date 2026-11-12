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
- La extensión Azure no reporta suscripciones en el tenant del proyecto. Esto
  no impide necesariamente administrar registros de aplicaciones en Entra ID.
- La sesión del portal abierta para esta revisión quedó en otro directorio:
  `6d2f5d7a-4f02-4dda-8a3a-407239da404a`. No crear ni modificar aplicaciones
  desde ese directorio. Primero debe cambiarse al tenant de arriba.
- El nombre del dominio público del frontend y la URL pública final de la API
  aún deben confirmarse.

## Requisitos para el propietario

La cuenta que hará la configuración debe poder seleccionar el tenant
`77747a67-519b-49e8-a701-13c4e011672c` y tener permisos de propietario de la
aplicación o un rol de Entra que permita administrar los registros y asignar
usuarios/roles (por ejemplo, Application Administrator). No se necesitan
permisos de Contributor sobre una suscripción para editar un app registration.

Si el tenant no aparece en el selector de directorios, el administrador del
tenant debe invitar la cuenta como usuario invitado y asignar los permisos
mínimos requeridos. No se deben compartir contraseñas, códigos MFA, tokens ni
client secrets por chat o correo.

## Pasos en el centro de administración Entra

1. Abrir <https://entra.microsoft.com/> y, desde el selector de directorios,
   cambiar al tenant `77747a67-519b-49e8-a701-13c4e011672c`. Confirmar el
   **Tenant ID** en **Entra ID → Overview** antes de editar.
2. Ir a **Entra ID → App registrations** y buscar el Client ID
   `cca6baa4-4933-4d00-b8a9-8c899dbfba57`.
   - Si existe en este tenant, reutilizarlo y verificar su configuración.
   - Si no existe, el propietario debe crear el registro antes de que se pueda
     configurar. No crear duplicados sin confirmar que el registro actual no
     existe.
3. En **Authentication**, agregar una plataforma **Single-page application
   (SPA)** con ambos redirect URI:
   - `http://localhost:4200` para la prueba local.
   - La URL HTTPS exacta del frontend publicado, una vez acordado el hosting.
   No crear un client secret para Angular.
4. En **Expose an API**, verificar:
   - Application ID URI:
     `api://cca6baa4-4933-4d00-b8a9-8c899dbfba57`
   - Scope delegado habilitado: `access_as_user`.
   - El scope puede consentirse por los usuarios de la organización, sujeto a
     la política del tenant.
5. En **App roles**, crear o verificar dos roles habilitados, asignables a
   **Users/Groups**, con valores exactos `ADMIN` y `CLIENTE`.
6. En **Enterprise applications → aplicación → Users and groups**, asignar las
   cuentas de prueba a sus roles. Preparar al menos un usuario `ADMIN` y uno
   `CLIENTE`; no compartir sus credenciales con el equipo.
7. Confirmar que el frontend registrado solicita el scope
   `api://cca6baa4-4933-4d00-b8a9-8c899dbfba57/access_as_user`, y que los access
   tokens para la API son v2. El backend espera los roles en el claim `roles`.
8. Guardar y entregar al equipo solo datos no secretos:
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
