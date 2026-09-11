# APK 0.2 · validación

APK compilado y firmado con certificado de depuración. Firma APK v2 verificada con apksigner. SHA256 en SHA256SUMS.

- Compilación app y tests + lintDebug aprobados: android-build.txt.
- ProtectionTest: 4/4. Notificación sintética, SDK local, alerta nativa, deduplicación, desactivación y minimización. Incluye una prueba heredada de ServiceTestCase.
- EngineTest: 2/2. SDK firmado y reporte/consulta contra API de prueba local 4321.
- ProtectionFlowTest: apertura por PendingIntent, detalle y formulario de reporte. Capturas android-detail.png y android-settings.png.
- Se comprobó que Android conecta el NotificationListenerService al conceder acceso. Se revocó ese permiso de prueba al terminar; la aplicación sigue requiriendo opt-in del usuario.

Las clases se ejecutan por separado en el emulador API 35 arm64. Una ejecución combinada obtuvo un timeout del motor al final (combined-run-timeout.txt); al aislarlo, EngineTest pasó 2/2. Una primera prueba de publicación consultaba el sistema antes de que notify terminara: el test ahora espera hasta 10 s la publicación. Hubo un bloqueo de SystemUI del emulador que se reinició antes de capturar la interfaz final. Estos resultados no constituyen una prueba en un teléfono físico ni una recepción real de WhatsApp.

El APK 0.2 usa reglas locales. QVAC móvil se desarrolla como versión 0.3 en otra tarea, conservando este artefacto. Los reportes a banco requieren confirmación e inicio de sesión; la notificación no transmite el mensaje ni crea por sí sola un caso remoto.

## Identificación y resultados del APK congelado

SHA-256 del APK de referencia:

```text
e25d74d5478d14fcac8c5b47494c194483a64d4c68124290c03d4b9c81818a06
```

| Clase ejecutada aisladamente | Resultado | Tiempo |
|---|---|---|
| ProtectionTest | 4/4 | 21,342 s |
| ProtectionFlowTest | 1/1 | 14,298 s |
| EngineTest | 2/2 | 2,491 s |

Los logs `android-tests.txt`, `service-tests.txt`, `flow-tests.txt`, `engine-tests.txt` y el fallo combinado anterior se conservan junto al artefacto en `pilot/artifacts/v0.2.0/`, fuera de Git. El APK tiene firma de depuración v2 verificada. No es una entrega para Play Store.

## Rama integrada

Las fuentes 0.2 proceden de una copia congelada antes del trabajo de QVAC Android. Los dos tests de protección se actualizaron a su revisión final, que espera la publicación asíncrona de la notificación. La rama conserva el SDK compartido corregido que proviene del PR #3, incluida su política y clave pública; ese bundle difiere de la versión base con la que se generó el APK de referencia.

Las siete pruebas nativas anteriores corresponden al APK identificado por el hash, no a un APK recompilado desde esta rama. Repetir esas pruebas en el APK integrado continúa pendiente; el emulador está reservado por la tarea de QVAC Android. Los comandos están en [la guía de alertas](../docs/ALERTAS-ANDROID.md).

### Compilación del código integrado

En esta rama finalizaron correctamente `:app:assembleDebug`, `:app:assembleDebugAndroidTest`, `:sdk:assembleRelease` y `:app:lintDebug`: **0 errores y 13 advertencias**. Se usaron JDK 17, Gradle 9.1.0 y Android SDK 35. La política, clave pública y bundle JavaScript se conservaron iguales en web, iOS y Android.

SHA-256 del APK recompilado en esta integración (sin prueba nativa todavía):

```text
17c8bf4a013e7e1880b568424f2ef1ae919599be0456bb3d1dfec657a2ad37c1
```
