# Servicio público de reportes del piloto

Base HTTPS: `https://certiva-landing.vercel.app/api/reports/`.
La versión Android 0.5 conecta Ingresar/Mis reportes con este servicio. La 0.4
publicada anteriormente conserva el transporte local. Es un piloto técnico,
no un servicio conectado al banco ni un canal de denuncia o emergencias.

## Acceso y almacenamiento

- Cuenta de revisión asignada, independiente del OAuth de descarga. No hay alta
  pública de cuentas de reportes. Credenciales aleatorias fuera del repositorio;
  solo verificaciones scrypt con sal se guardan en almacenamiento privado.
- Vercel Functions + Vercel Private Blob dedicado, región iad1. No utiliza ni
  migra la SQLite, usuarios o contraseñas de la demo local de puerto 4320.
- `BLOB_READ_WRITE_TOKEN`, `REPORTS_COOKIE_SECRET` y `REPORTS_ENABLED` existen solo
  en producción. Las credenciales no se incluyen en APK, páginas ni logs.
- Lecturas consistentes (`useCache:false`); actualizaciones con ETag y seis
  reintentos como máximo. No se depende de memoria de una función para persistir.
- Sesión cifrada de una hora, cookie Secure/HttpOnly/SameSiteStrict, hasta cinco
  sesiones por cuenta. Revocación efectiva al salir. CSRF obligatorio para cambios.
- Rechazo de orígenes externos y fetch cross-site; cliente nativo sin Origin permitido.
- Límites persistentes: 20 intentos de login por IP en cinco minutos y 120 globales
  por minuto, 30 reportes/hora/cuenta y 200 reportes/cuenta. La cuota horaria se conserva
  al borrar reportes; usa marcas temporales separadas del contenido. Solo se guarda un HMAC
  temporal de IP para el limitador; Vercel tiene sus propios logs de infraestructura.
- Reportes mínimos con consentimiento, sin mensaje original, remitente, enlaces,
  imágenes ni datos bancarios. Mis reportes solo devuelve los de la cuenta actual.
  Un mismo assessmentId no crea duplicados; payload diferente devuelve409.
- Borrado explícito de todos los reportes propios con confirmación. Se conservan
  hasta borrado/solicitud o fin del piloto; no se promete una purga automática.
- Sin consola pública de analistas ni envío al banco. Los casos recibidos quedan
  como registros del piloto con estado nuevo y procedencia no verificada.

## Rutas

POST login `{username,password}` devuelve role cliente y CSRF, además de cookie.
GET cases lista reportes propios. POST cases recibe los nueve campos mínimos.
POST erase `{confirm:true}` borra reportes propios. POST logout revoca la sesión.
GET session consulta la identidad. GET health informa que el servicio está habilitado.
Errores upstream siempre genéricos; ninguna ruta expone claves o URLs privadas Blob.

## Aprovisionamiento y mantenimiento

`scripts/provision-reports.mjs DIRECTORIO_PRIVADO` crea únicamente la cuenta de
revisión autorizada y conserva sus credenciales en ese directorio. Requiere un
archivo de variables obtenido con Vercel CLI dentro del mismo directorio privado.
Nunca usar una ruta versionada ni copiar ese archivo a un ticket, PR o captura.
La cuenta no se comparte con testers. Otras cuentas requieren autorización.

Al terminar el piloto: desactivar REPORTS_ENABLED, revocar credenciales y eliminar
el almacén dedicado conforme a las solicitudes de privacidad y conservación.
La capacidad actual es para evaluación limitada; no es una arquitectura bancaria.

## Evidencia

- 9 pruebas del servicio: sesión, aislamiento, minimización, CSRF, idempotencia,
  concurrencia, límites incluso después del borrado y errores sin filtración.
- Una prueba de aprovisionamiento rechaza repositorios renombrados, worktrees y
  enlaces simbólicos que apunten a un repositorio, antes de crear credenciales.
- Prueba HTTP real: login → dos envíos concurrentes del mismo reporte sintético →
  mismo caso → nueva sesión → persistencia → borrado → logout, aprobada.
- Android 0.5 variante debug, target36, emulador Android15/API35: dos pruebas
  instrumentales aprobadas en 6.242 s. SDK firmado real generó reporte mínimo y
  PilotAPI lo envió al HTTPS público. Sin localhost ni adb reverse.
- AAB 0.5 release firmado, lint: 0 errores, 20 avisos. APK física/instalación desde Play,
  Android16 y funcionamiento real de QVAC siguen pendientes.

Política pública actualizada: `/privacidad-app`. El canal cerrado sigue pendiente;
BETA_ENABLED=true y BETA_PLAY_READY=false. El servicio de reportes no cambia ese estado.

Estado del corte: suite completa de integración30/30PASS; despliegue
`dpl_3zFYuMHF2nCxhN75g9EypSBiH2xe` READY. Android 0.5publicado en prueba interna
el 11 de septiembre, 07:19 de Panamá. Bryan autorizó después entregar la credencial exclusiva al revisor de Google Play;
la tarea propietaria confirmó guardado del formulario con las instrucciones 0.5.
No se incluye esa credencial en Git, APK ni evidencias. El canal cerrado sigue
pendiente de los requisitos restantes.

## Correcciones de la revisión independiente

El primer servicio desplegado reiniciaba el límite horario al borrar los reportes.
La PR conserva la cuota en reportTimes, incluso para cuentas existentes; el borrado
elimina los reportes, pero no habilita otros30 envíos dentro de la misma hora.
Las marcas antiguas se descartan al siguiente envío o borrado. La política describe
ese uso. La comprobación del directorio privado ya no depende del nombre del repo.

Estas correcciones pasaron30 pruebas y build en la copia de revisión. En el último
estado confirmado, todavía no estaban copiadas ni desplegadas por la tarea propietaria.
La evidencia HTTP/Android real corresponde a la versión anterior a estas correcciones.
