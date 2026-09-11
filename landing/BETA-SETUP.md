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
5. El visitante acepta la prueba cerrada en Google Play e instala la aplicación.

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
- `BETA_ENABLED`: conservar `false` hasta completar las verificaciones siguientes.

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
- Google Play exige completar la configuración inicial. La descripción general de
  publicación ya muestra la declaración financiera actualizada; siguen pendientes
  la ficha y otros datos obligatorios de la app. No se ha enviado a revisión y el
  canal cerrado **no está publicado**.
- Las siete variables de producción están configuradas como sensibles en Vercel
  por la tarea propietaria, mediante CLI y con autorización de Bryan.
  `BETA_ENABLED` permanece en `false`; el formulario público sigue oculto.
- Despliegue comunicado por la tarea propietaria:
  `dpl_ESYDTVEkiQY47f9eguS7vyuh1tG9`, READY y asociado al alias público.
  Consulta pública independiente de `/api/beta/status`: HTTP 200,
  `enabled:false`, `registered:false`, con enlace a la prueba interna.
- `npm test`: 16 pruebas aprobadas en la integración; la tarea propietaria repitió
  las 9 pruebas beta y el build antes del despliegue, ambos correctos.

## Antes de activar

1. Mantener las variables sensibles configuradas y comprobar el estado del despliegue.
2. Conservar el registro desactivado mientras Google Play no ofrezca el canal cerrado.
3. Completar ficha, privacidad, clasificación, acceso y declaraciones de Google Play;
   enviar la prueba cerrada a revisión y comprobar que esté disponible.
4. Confirmar el mercado de las cuentas de prueba y ampliar países si corresponde.
5. Activar `BETA_ENABLED=true`, desplegar y verificar OAuth → membresía → Google Play.

La distribución por Google Play no demuestra por sí sola que la IA QVAC funcione
en todos los dispositivos ni que desaparezcan todas las advertencias de seguridad.
