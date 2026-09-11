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

- Prueba interna de Certiva 0.5 publicada; instalación física desde Play todavía no verificada.
- Grupo privado creado y cuenta técnica añadida con rol de propietario.
- Cloud Identity API habilitada. Consulta real del grupo: HTTP 200.
- Alta idempotente del propietario existente y alta de un verificador externo previamente
  autorizado comprobadas con la API real y confirmación posterior de membresía.
  Falta verificar el recorrido completo desde el navegador de un visitante.
- Cliente OAuth web creado y estado público **En producción**, autorizado por Bryan;
  credenciales conservadas fuera del repositorio.
- Canal cerrado Alpha configurado con el grupo y Panamá como mercado inicial.
- Borrador cerrado Alpha actualizado a **0.5.0 · Certiva · Prueba cerrada**,
  con el único AAB versión 5; reemplaza al paquete 4 del borrador anterior.
- Política Android publicada y guardada en Play: `/privacidad-app`. Categoría
  Herramientas; correo de soporte y sitio HTTPS guardados.
- Ficha marcada como lista tras la intervención de Bryan, según la tarea propietaria.
  Los materiales archivados de la ficha 0.4 conservan su alcance histórico.
- IARC autorizado y completado: clasificación general3+/ESRB Todos, según la
  confirmación de la tarea propietaria. Público objetivo mayores18 guardado.
- Acceso para revisores:
  Android0.5 ya conecta Ingresar/Mis reportes por HTTPS. La tarea propietaria
  confirmó que guardó las credenciales exclusivas y las instrucciones del revisor,
  tras autorización expresa de Bryan; no se incluyen sus valores en esta documentación.
- Seguridad de datos completada e ID de publicidad declarado como «No», según
  la tarea propietaria.
- **14 cambios enviados a revisión**. Console muestra «Cambios en la etapa de
  revisión» y comprobaciones rápidas iniciales; todavía no se ha confirmado
  aprobación ni disponibilidad de la prueba cerrada.
- Publicación administrada desactivada; Panamá y el grupo de verificadores se
  conservan. El envío a revisión no activa la bandera de descarga de la web.
- Registro habilitado por solicitud de Bryan para probar desde Android: `BETA_ENABLED=true`.
- Descarga cerrada pendiente: `BETA_PLAY_READY=false`. Las ocho variables están guardadas
  como sensibles en Vercel. OAuth público permite registrarse sin prometer instalación.
- Pruebas de registro: 13 aprobadas (10 de backend y 3 de estados de interfaz).
  Suite completa tras integrar la corrección: 20/20 aprobadas. Build de la tarea
  propietaria correcto.
- Tras la corrección del formulario, Bryan confirmó que el registro en Android
  funciona. Es una confirmación del usuario, sin traza instrumentada de esta tarea.

## Contrato de estado y activación de descarga

`GET /api/beta/status` entrega `enabled`, `playReady`, `registered` e `internalUrl`.
`email` solo se entrega con registro confirmado y habilitado. `playUrl` solo se entrega
además con `BETA_PLAY_READY=true`. Respuesta privada `no-store`.

Con registro abierto y descarga pendiente, la interfaz muestra el formulario y el aviso
«Registro abierto · Descarga pendiente». Tras confirmar la membresía, muestra el correo
añadido al grupo, conserva el aviso y no ofrece un enlace de instalación. No cambian
el consentimiento, los scopes OAuth ni la política de privacidad del registro.

Antes de cambiar `BETA_PLAY_READY` a `true`:

1. Confirmar aprobación de los cambios enviados a Google Play.
2. Comprobar que la prueba cerrada esté publicada y accesible.
3. Confirmar el mercado de las cuentas de prueba y ampliar países si corresponde.
4. Activar la bandera, desplegar y verificar aceptación de la prueba e instalación.

La distribución por Google Play no demuestra por sí sola que la IA QVAC funcione
en todos los dispositivos ni que desaparezcan todas las advertencias de seguridad.

## Corrección del formulario en Chrome (11 de septiembre)

La prueba física de Bryan encontró `error: origin` antes de OAuth. La política
HTTP global `no-referrer` podía enviar `Origin: null` en el POST de formulario.
`probar.html` ahora declara `<meta name="referrer" content="same-origin">`,
aplicable solo a esa página. Se conserva la comprobación estricta del origen en
el servidor y `no-referrer` en las respuestas OAuth; no se aceptan orígenes nulos,
ausentes, externos ni dominios parecidos. Las 12 pruebas beta y el build pasan.

Despliegue corregido: `dpl_9iv8W9NbzyVx6P1e8wvB5GpsfDUH`, READY y con alias
principal. Se comprobó el envío desde Chrome de escritorio: abre el selector de
cuenta de Google. La repetición de la prueba en Android físico queda pendiente.
Referencias: [política y cabecera Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy#effect_on_the_origin_header) y [algoritmo normativo de Fetch](https://fetch.spec.whatwg.org/#append-a-request-origin-header).

Verificación posterior del mismo despliegue: recorrido completo en Chrome de
escritorio aprobado (formulario → selector Google → consentimiento de correo →
callback → «Tu registro está confirmado», con la cuenta propietaria ya existente).
El aviso de descarga pendiente permanece visible y no aparece el enlace de
instalación. Esto verifica membresía idempotente, no una nueva alta externa desde
Android ni instalación física.

Actualización comunicada por la tarea propietaria después de esa prueba: Bryan confirmó
registro correcto en Android y pidió avanzar con la descarga. No acredita instalación
desde Play ni una nueva alta externa instrumentada; el canal cerrado sigue pendiente.

## Registro → Google Play

El callback ya prepara una redirección HTTP 303 directa al destino Play exacto,
solo después de verificar identidad y confirmar membresía, y solo cuando
`BETA_PLAY_READY=true`. No incluye correo ni tokens en el destino y mantiene
`Referrer-Policy: no-referrer`. Si el canal sigue pendiente se vuelve a la
confirmación del registro. Los fallos nunca redirigen a Play.

13 pruebas beta aprobadas y build correcto. La bandera de producción se conserva
en `false`; el código preparado no equivale a publicar el canal cerrado.
Bryan comunicó que el registro en Android ya terminó correctamente; no se ha
comprobado una instalación física desde Play.

Despliegue de este corte comunicado por la tarea propietaria:
`dpl_98DyQHhxBznSeP635h4mALX3aP1y`, READY y asociado al alias público.

## Reportes públicos de Android0.5

El servicio HTTPS y la aplicación0.5 tienen un corte revisado, con cuenta asignada
independiente del registro Google. Véase [REPORTS-SETUP.md](REPORTS-SETUP.md).
La suite de integración pasa30pruebas; la tarea propietaria ejecutó dos pruebas
nativas contra HTTPS y publicó version5 en prueba interna el11de septiembre07:19Panamá.
También guardó el acceso exclusivo de revisión, previa autorización de Bryan.
El canal cerrado sigue sin publicar. Las correcciones de cuota/provisioning aún
necesitan incorporarse al despliegue. Registro habilitado y descarga cerrada pendiente.

Última actualización Play comunicada por la tarea propietaria: versión 0.5 enviada
a revisión con 14 cambios, ficha lista y declaraciones guardadas. El estado de
revisión no confirma aprobación ni descarga cerrada. Backend revisado en PR #38
y Android en PR #37, ambos integrados en main; las correcciones del backend
siguen pendientes de despliegue.
