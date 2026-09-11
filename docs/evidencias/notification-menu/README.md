# Notificación de prueba, menú 0.4 y caso en consola

Caso `b63be9f8-f051-4873-a4a8-9823254f8711`, assessment `1de8045a-1df9-4433-80fe-0a9210539f8b`. La APK 0.4 conserva SHA-256 `8ee2f1d708149db3043e2de50b40df441116bf67244ed8ea654b0a63486b468f`.

| Ejecución | Resultado funcional | Uso del video |
| --- | --- | --- |
| [Móvil02](notification-menu-real-20260911-02/result.json) | Prueba aprobada en 53,496 s: listener/motor de producción, alerta nativa, detalle, menú, consentimiento y reporte del mismo assessment. | Original 720×1600 de 47,171256 s, entrada rotulada como demo. |
| [Administración02](notification-menu-admin-20260911-02/result.json) | Prueba aprobada en 33,163 s; asignación/resolución confirmadas en backend. | QA visual fallida: contenido vertical dentro del lienzo horizontal. No usar como toma aprobada de presentación. |
| [Consulta administrativa03](notification-menu-admin-review-20260911-03/result.json) | Prueba aprobada en 45,953 s; consulta posterior de solo lectura, mismo caso y eventos exactos. | Original 1280×576 de 13,108289 s, QA aprobada. Muestra el estado resuelto; no repite las acciones de resolución. |
| [Móvil01](notification-menu-real-20260911-01/result.json) | Falló ante el servidor anterior; no creó caso. | Intento fallido conservado como diagnóstico. |
| [Consulta administrativa02](notification-menu-admin-review-20260911-02/result.json) | Falló la precondición antes del login. | No es una toma aprobada. |

La consulta administrativa03 conserva idénticos `finalCase` y `auditEvents` respecto a administración02. El login y las lecturas pueden generar registros generales de auditoría; esta comprobación se refiere al caso y sus eventos, sin nuevas mutaciones de ese caso. No todos los eventos específicos aparecen en el último encuadre: la lectura independiente los verifica.

## Alcance del flujo móvil

La entrada es un `StatusBarNotification` sintético que el harness entrega al listener de producción. El servicio calcula el resultado real con reglas y publica una notificación nativa; no se inyecta el assessment. El harness habilita temporalmente el procesamiento. No valida onboarding, conexión real del listener al sistema, entrega de WhatsApp, segundo plano en un teléfono físico ni QVAC. `aiStatus` sigue en `unavailable`.

El falso positivo `envio_para_recibir` para una solicitud de código continúa documentado y sin corregir. La toma aprobada utiliza otro mensaje inequívoco verificado antes de grabar; cambiar el ejemplo no resuelve el defecto. [Hallazgos y procedencia](../../../pilot/demo-preparation/notification-menu-v04/INTEGRATION-FINDINGS.md).

## Archivo y reproducción

- [Fuentes aisladas y ejecución explícita](../../../pilot/demo-preparation/notification-menu-v04/README.md): cuatro clases Java y recorder Python fuera de los sourceSets de producción.
- [ZIP con originales, resultados e intentos fallidos](https://github.com/Andresssrr24/certiva/releases/download/avances-2026-09-11/certiva-notificacion-menu-20260911.zip).
- [Manifiesto y hashes](MANIFIESTO.json). ZIP SHA-256 `a20ec55b18faea5c4cf19a2d09e0dd1d5acd17b49df0ed1e44f0e5710e128127`.

Al publicar se validaron JSON, sintaxis Python, hashes y metadatos ffprobe de cuatro MP4; se cotejaron IDs y exactitud del caso/eventos entre ambas tomas administrativas. Se revisaron las hojas de contacto móvil02 y consulta03. No se recompilaron APKs, no se ejecutó el harness ni se accedió al emulador o al piloto. El montaje comercial con audio permanece a cargo de la tarea de video.
