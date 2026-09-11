# Registro de verificadores de Certiva

La página `/probar` registra cuentas de Google verificadas en el grupo privado
`certiva-testers@grwestate.com`. El QR conserva `/apk`, que redirige a `/probar`.
Mientras el registro está desactivado, la página ofrece la prueba interna a las
cuentas que ya tienen invitación; no promete acceso a visitantes nuevos.

## Flujo

1. El visitante introduce su correo y acepta participar.
2. Google verifica la identidad con OAuth (`openid email`), state, nonce y PKCE.
3. El servidor agrega únicamente el correo confirmado por Google como `MEMBER`.
4. El servidor consulta de nuevo la membresía; una operación pendiente o fallida
   nunca muestra una confirmación de acceso.
5. Se confirma el registro en el grupo. Solo cuando `BETA_PLAY_READY=true` se ofrece aceptar la prueba cerrada e instalar; mientras tanto se informa que la descarga está pendiente.

Las cookies son cifradas con AES-256-GCM, `HttpOnly`, `Secure` y `SameSite=Lax`.
La sesión OAuth dura 10 minutos y el resultado privado, una hora. No se guardan
contraseñas de Google. Los correos no se incluyen en la URL del resultado.

## Google Cloud y Workspace

Proyecto dedicado: `certiva-beta`. Cliente web: `Certiva Landing · Acceso de verificadores`.
Retorno autorizado: `https://certiva-landing.vercel.app/api/beta/callback`.
La marca enlaza a la landing y a `/privacidad-beta`.

La cuenta `certiva-beta-members@certiva-beta.iam.gserviceaccount.com` administra
únicamente el grupo de verificadores como propietario. No recibe roles IAM
globales, rol de administrador de Workspace ni delegación de todo el dominio.
La integración usa Cloud Identity API con el scope `cloud-identity.groups`.
El correo del grupo está fijado en el servidor; no procede de la solicitud pública.
El propietario puede administrar todo ese grupo, por lo que su clave es sensible.

Guía oficial: https://docs.cloud.google.com/identity/docs/how-to/setup

## Variables de producción en Vercel

Guardar los valores como variables **sensibles**, nunca en `public/`, Git,
capturas, logs ni argumentos visibles de comandos:

- `BETA_GOOGLE_CLIENT_ID`
- `BETA_GOOGLE_CLIENT_SECRET`
- `BETA_COOKIE_SECRET`: aleatorio, mínimo 32 caracteres.
- `BETA_GROUP_SERVICE_ACCOUNT_EMAIL`
- `BETA_GROUP_PRIVATE_KEY`: PEM con saltos de línea reales.
- `BETA_PLAY_URL`: `https://play.google.com/apps/testing/local.certiva.pilot`
- `BETA_ENABLED`: `true` habilita el registro con Google.
- `BETA_PLAY_READY`: `false` hasta comprobar que la prueba cerrada está publicada y accesible.

## Estado comprobado el 11 de septiembre de 2026

- Prueba interna de Certiva 0.4 publicada; instalación física todavía no verificada.
- Grupo privado creado y cuenta técnica añadida con rol de propietario.
- Cloud Identity API habilitada. Consulta real del grupo: HTTP 200.
- Alta idempotente del propietario existente y alta de un verificador externo previamente
  autorizado comprobadas con la API real y confirmación posterior de membresía.
  Falta verificar el recorrido completo desde el navegador de un visitante.
- Cliente OAuth web creado y estado público **En producción**, autorizado por Bryan;
  credenciales conservadas fuera del repositorio.
- Canal cerrado Alpha configurado con el grupo y Panamá como mercado inicial.
- Paquete 4 / `0.4.0-menu-experimental`, target 36, agregado al borrador cerrado.
- Google Play confirma **6 de 11 tareas iniciales completas**: privacidad, anuncios,
  apps gubernamentales, funciones financieras, salud y categoría/contacto.
- Política Android publicada y guardada en Play: `/privacidad-app`. Categoría
  Herramientas; correo de soporte y sitio HTTPS guardados.
- Ficha es-419 guardada como borrador con descripción, icono 512, gráfico 1024×500
  y dos capturas reales del menú. Falta resolver la declaración de recursos de IA.
- Clasificación de contenido pendiente de aceptación de condiciones IARC.
- Público 18+ aprobado por Bryan; el formulario depende de Detalles de acceso.
  Bryan decidió conservar Ingresar/Mis reportes y conectar su servicio público
  después. Falta acceso completo para revisores a esas funciones.
- Seguridad de datos guardada como borrador: descarga HTTPS del modelo y cuentas
  asignadas externamente. Faltan tipos, usos y revisión final de la declaración.
- No se ha enviado la app a revisión; el canal cerrado **no está publicado**.
- Registro habilitado por solicitud de Bryan para probar desde Android: `BETA_ENABLED=true`.
- Descarga cerrada pendiente: `BETA_PLAY_READY=false`. Las ocho variables están guardadas
  como sensibles en Vercel. OAuth público permite registrarse sin prometer instalación.
- Pruebas de registro: 12 aprobadas (9 de backend y 3 de estados de interfaz).
  Suite completa de integración: 19/19 aprobadas y build correcto.
- Despliegue de la tarea propietaria: `dpl_7BiYWCnNmGCkYotp7k7tBWewbjaa`, READY.
  GET público independiente: `enabled:true`, `playReady:false`, `registered:false`.
- El recorrido completo de OAuth en un Android físico queda pendiente de la prueba de Bryan.

## Contrato de estado y activación de descarga

`GET /api/beta/status` entrega `enabled`, `playReady`, `registered` e `internalUrl`.
`email` solo se entrega con registro confirmado y habilitado. `playUrl` solo se entrega
además con `BETA_PLAY_READY=true`. Respuesta privada `no-store`.

Con registro abierto y descarga pendiente, la interfaz muestra el formulario y el aviso
«Registro abierto · Descarga pendiente». Tras confirmar la membresía, muestra el correo
añadido al grupo, conserva el aviso y no ofrece un enlace de instalación. No cambian
el consentimiento, los scopes OAuth ni la política de privacidad del registro.

Antes de cambiar `BETA_PLAY_READY` a `true`:

1. Completar ficha, clasificación, acceso y declaraciones de Google Play.
2. Enviar la prueba cerrada a revisión y comprobar que esté publicada y accesible.
3. Confirmar el mercado de las cuentas de prueba y ampliar países si corresponde.
4. Activar la bandera, desplegar y verificar aceptación de la prueba e instalación.

La distribución por Google Play no demuestra por sí sola que la IA QVAC funcione
en todos los dispositivos ni que desaparezcan todas las advertencias de seguridad.
