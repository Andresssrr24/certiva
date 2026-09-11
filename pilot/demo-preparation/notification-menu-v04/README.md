# Preparación aislada: notificación → menú 0.4 → reporte → consola

Estas fuentes están fuera de `androidTest`. Preparadas para el nuevo vídeo solicitado por Bryan, con cesión coordinada del emulador 5580 después de UI/Menu y Play. Las fuentes por sí solas no sustituyen la evidencia de ejecución enlazada abajo.

Estado posterior: pruebas compiladas y ejecutadas en la copia aislada `certiva-notification-demo-build`. Flujo móvil aprobado en `../../artifacts/notification-menu-real-20260911-02`; operaciones de consola aprobadas pero vídeo estrecho en `../../artifacts/notification-menu-admin-20260911-02`; consulta final horizontal y de solo lectura aprobada en `../../artifacts/notification-menu-admin-review-20260911-03`. Los JSON/logs de cada carpeta son la evidencia; se conservaron los intentos fallidos.

- Base: `/Users/bryanlarez/Documents/DESARROLLO/certiva-pr-interfaz-menu`.
- APK congelada: `pilot/artifacts/menu-ui-20260911/certiva-0.4-menu-experimental.apk` en esa base.
- SHA-256: `8ee2f1d708149db3043e2de50b40df441116bf67244ed8ea654b0a63486b468f`.
- Requiere emulador sin modelo QVAC instalado, permiso de notificaciones concedido y piloto real disponible en 4320 mediante `adb reverse`.
- Copiar las clases Java necesarias para el recorrido elegido a un sourceSet de pruebas en una copia de compilación aislada. Compilar solo AndroidTest; instalar la APK experimental congelada cuando se obtenga el turno. El recorder instala únicamente la APK de pruebas y verifica el SHA de la aplicación instalada.

## Recorrido y límites

`NotificationMenuDemoTest` muestra una notificación de entrada con el título **Mensaje de prueba · Demo en emulador**. Entrega su contenido mediante un `StatusBarNotification` sintético al servicio de producción adjuntado con `ServiceTestCase`. El servicio ejecuta el motor real, guarda el resultado y publica la alerta mediante `ProtectionNotifications.post`. No se inserta un assessment ni se fija el resultado.

Se espera riesgo por reglas locales y `aiStatus=unavailable`. La prueba toca la notificación real de Android, comprueba el ID del detalle, recorre Inicio/Menú/Alertas/Verificar y confirma el envío en el diálogo de consentimiento. El GET final comprueba que el servidor conservó ese mismo assessment. Restaura las preferencias previas al terminar y solo cancela las notificaciones de esta demo.

La activación del procesamiento se establece temporalmente en el harness. **No prueba onboarding, entrega desde WhatsApp real, conexión del listener al sistema, segundo plano real ni inferencia QVAC.** El montaje debe mantener visible la identificación de demo en emulador. La notificación de entrada pertenece a la app de prueba; no simula visualmente que otra app instalada la haya enviado.

`AdminNotificationDemoTest` abre la consola real para ese caso nuevo, lo toma, selecciona Sin evidencia suficiente y lo resuelve. Inicia su grabador después del login, guarda timestamps y no realiza capturas PNG durante las fases. Comprueba los estados visibles; la lectura final del caso y su auditoría se hace desde el host. El JSON nativo conserva `uiPassed` por separado de la verificación independiente.

`AdminCaseReviewDemoTest` es la consulta posterior del mismo caso ya resuelto: solo abre detalles y auditoría, sin nuevos reportes ni cambios del caso. Para `record-demo.py review`, bloquear antes el emulador en horizontal (`adb -s emulator-5580 shell wm user-rotation lock 1`) y restaurar su estado anterior al terminar. La prueba exige WebView más ancho que alto y espera el dibujo de la página autenticada antes de grabar. En esta sesión se restauró `lock 0` después de extraer la evidencia.

`ListenerMetadataTest` es un diagnóstico aislado del motor y metadatos sin autenticación ni envío, utilizado para identificar el rechazo del servidor anterior y el motivo falso positivo documentado en `INTEGRATION-FINDINGS.md`.

Los originales se graban a 720×1600 (móvil) y 1280×576 (consola), con SIGINT y espera de salida antes de cerrarlos. Los resultados fallidos no se convierten en aprobados al recuperar un MP4. Si una grabación falla después de enviar o resolver, inspeccionar el caso existente antes de cualquier nueva ejecución: no reiniciar estados ni duplicar envíos automáticamente.

## Ejecución explícita

```sh
python3 record-demo.py mobile /ruta/nueva/evidencia-movil \
  --apk /ruta/certiva-0.4-menu-experimental.apk \
  --test-apk /ruta/app-debug-androidTest.apk \
  --perform-live-demo-action

python3 record-demo.py admin /ruta/nueva/evidencia-admin \
  --apk /ruta/certiva-0.4-menu-experimental.apk \
  --test-apk /ruta/app-debug-androidTest.apk \
  --mobile-result /ruta/nueva/evidencia-movil/result.json \
  --perform-live-demo-action
```

El script lee el acceso local privado y lo elimina del almacenamiento de la app tras usarlo. No incluir credenciales en las capturas, el repositorio ni las salidas. La aplicación mantiene la sesión por instancia de Activity: al abrir el formulario desde el detalle se requiere autenticación real adicional; no se falsifican cookies ni el estado de login.

Cada ejecución produce el log de instrumentación, JSON nativo sin modificar, resultado agregado, vídeo original y ffprobe. La consola añade lectura independiente del caso y eventos. Verificar visualmente los MP4 antes de entregarlos al montaje.

Archivo publicado: [resultados, límites y grabaciones](../../../docs/evidencias/notification-menu/README.md). No se recompiló ni se ejecutó nuevamente el flujo al archivar esta entrega.
