# Certiva: bloqueo de Play Protect

Fecha: 2026-09-11. Estado: diagnóstico y borrador; no enviado a Google. No se ha conseguido desbloquear ni validar la instalación en el teléfono de Bryan.

## Evidencia

El usuario describe una advertencia de peligrosidad por acceso a datos sensibles. Esto coincide con la categoría «Se bloqueó la app para proteger tu dispositivo» de la guía oficial, aunque falta una captura o transcripción completa para confirmar la categoría exacta.

Google documenta, en los mercados donde está activa esa protección, el bloqueo de APK descargadas desde Internet que declaran acceso sensible, incluido un listener de notificaciones. [Guía oficial de advertencias de Play Protect](https://developers.google.com/android/play-protect/warning-dev-guidance?hl=es-419), consultada el 11 de septiembre de 2026.

APK del QR inspeccionada:
- URL: https://certiva-landing.vercel.app/downloads/certiva-0.3-qvac-experimental-21542a5a.apk
- Paquete: local.certiva.pilot
- Versión: 3 / 0.3.0-qvac-local
- SHA-256 del archivo: 21542a5afe71591a1327fb39878e8044adaf77dd7aaaec27d347465de7dec942
- Tamaño: 71,201,693 bytes
- Android mínimo 13/API33; target API35; ARM64
- Firma válida según apksigner; certificado Android Debug
- SHA-256 del certificado: 3661888b3d67395498f6766a0e31f369b22fb08c791ca50406bc9fb338132225
- debuggable=true
- Permisos de aplicación: INTERNET, POST_NOTIFICATIONS
- Servicio: local.certiva.pilot.CertivaNotificationListener, protegido por BIND_NOTIFICATION_LISTENER_SERVICE, con NotificationListenerService declarado

La firma válida no demuestra que una aplicación sea segura. Estos datos no son una auditoría completa del SDK ni prueban la causa definitiva de la clasificación de Google. Cambiar a firma release es necesario para una distribución mantenible, pero no garantiza eliminar este bloqueo por acceso a notificaciones.

## Ruta para conservar las alertas

Mantener transparente el acceso necesario, revisar cumplimiento y solicitar revisión por el canal oficial de Play Protect. Preparar distribución de pruebas mediante Google Play. Este diagnóstico corresponde a la APK debug identificada arriba; no acredita una publicación ni una aprobación de Google Play. La revisión no garantiza aprobación y no tiene plazo confirmado.

Una variante de revisión manual podría eliminar el listener y su acceso, a cambio de perder las alertas automáticas de WhatsApp. Es un cambio de producto que no se ha aplicado. No se garantiza que una variante quede exenta de otras comprobaciones.

## Borrador de solicitud (pendiente de autorización y datos del titular)

**Asunto:** Solicitud de revisión de bloqueo de instalación — Certiva Piloto, local.certiva.pilot

Solicitamos revisar el bloqueo de instalación de nuestra APK experimental Certiva Piloto. Un usuario que la descarga desde nuestro enlace HTTPS informa de una advertencia sobre acceso a datos sensibles. Adjuntamos el paquete y las huellas identificadas arriba para que se evalúe el archivo concreto.

El objetivo de Certiva es ayudar al usuario a reconocer señales de fraude. La función de protección utiliza NotificationListenerService para revisar texto visible de notificaciones de WhatsApp y WhatsApp Business. El flujo de la aplicación incluye una explicación de este acceso, activación voluntaria y autorización separada en Ajustes de Android. También ofrece desactivación y revisión manual de texto. No usamos accesibilidad ni lectura directa de SMS.

En el código revisado, el listener filtra los paquetes compatibles y procesa el texto con el motor local. El almacenamiento de alertas proyecta metadatos de resultados, con un máximo de 20 y limpieza por antigüedad al acceder; los reportes del piloto son una acción separada con confirmación. Debemos aportar evidencia del comportamiento de esta compilación y completar la revisión de sus dependencias antes de afirmar cumplimiento integral.

Esta APK usa actualmente firma de desarrollo. QVAC en Android y la recepción de WhatsApp en un teléfono físico siguen pendientes de validación completa. No presentamos la APK como producto bancario oficial ni como una versión de producción auditada.

Agradecemos que indiquen si el bloqueo corresponde a la protección contra instalaciones desde Internet con acceso a notificaciones o a otro hallazgo específico, y qué correcciones se requieren para su distribución legítima.

**Pendiente para completar el formulario:** cuenta/contacto del titular, captura y modelo/versión Android del dispositivo afectado, y evidencia verificable del consentimiento y tratamiento de datos en la APK enviada. No se han enviado archivos, datos del usuario ni mensajes a Google.

## Seguimiento posterior al diagnóstico

La tarea de distribución confirmó posteriormente la versión4 con target36 activa y disponible para verificadores internos en Play Console. [Estado y acceso a pruebas internas](API36-Y-NAVEGACION-ATRAS.md#disponibilidad-para-pruebas-internas). No se ha verificado la instalación desde Play ni enviado esta apelación. Este documento no declara aprobado el paquete ni resuelto el bloqueo del teléfono.
