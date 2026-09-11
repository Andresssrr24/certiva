# Android API36 y navegación Atrás

La aplicación nativa conserva la interfaz 0.4 y sube `compileSdk` y `targetSdk` a 36; el mínimo sigue en API33. `MainActivity` registra `OnBackInvokedCallback` cuando se muestra Verificar, Alertas o Menú y lo retira al volver a Inicio o destruir la actividad. Así Atrás vuelve al inicio desde una sección y deja al sistema gestionar la salida desde la raíz.

La migración sustituye `onBackPressed`, que ya no se invoca para aplicaciones con target36 ejecutadas en Android16. [Cambios oficiales de Android16](https://developer.android.com/about/versions/16/behavior-changes-16), consultados el 11 de septiembre de 2026. El manifiesto habilita explícitamente el callback.

## Validación disponible

La tarea de preparación ejecutó dos pruebas nativas del dispatcher de Atrás y de recreación con borrador conservado: **2/2 en 20,813 s**, sobre un emulador **Android15/API35**. El target del APK era36. **No se probó Android16 ni su gesto predictivo**; esa validación sigue pendiente.

En su copia aislada pasaron bundleRelease, lintRelease y builds debug/test: 222 tareas, 27 s, lint 0 errores y 21 advertencias. [Log y resumen de evidencia](../evidencias/android-api36-20260911/result.json). El build de preparación utilizó configuración privada de firma que no forma parte de este PR. El repositorio conserva únicamente código, pruebas y documentación; no incluye claves ni bundles.

Al publicar se aplicó el patch sobre el menú final y se comprobó igualdad de MainActivity, manifiesto y test con los archivos probados. Se revisaron logs y se contaron las advertencias del XML de lint. No se repitieron compilación ni instrumentación durante la integración.

La APK debug target35 publicada como `certiva-0.4-menu-experimental.apk` continúa siendo un artefacto histórico con sus propias pruebas. No se reemplazó el QR ni ese archivo con esta preparación API36. La distribución en Google Play y la apelación de Play Protect se gestionan por separado; la disponibilidad interna descrita abajo no acredita aprobación de Google ni desbloqueo del teléfono.

## Disponibilidad para pruebas internas

La tarea de distribución confirmó en Play Console el 11 de septiembre de 2026 a la 01:26 (Panamá) el segmento **Activo**, «Disponible para verificadores internos», versión4 con target36. La ficha conserva el nombre temporal `local.certiva.pilot (unreviewed)`. [Acceso a la prueba interna](https://play.google.com/apps/internaltest/4701618464331966700), sujeto a la cuenta autorizada como verificador.

El bundle aceptado tiene SHA-256 `2dc6cd615ecf5439bd39b05d11c421dc29e373b5446cbb2791c740d9c5e5879e` y 41.966.733 bytes. Se registra su identidad, sin incorporar el AAB ni el material de firma al repositorio. La única advertencia informada fue la ausencia del mapping R8; la compilación no usa ofuscación.

La instalación real desde Google Play todavía no se verificó. Tampoco se acreditan ejecución en Android16, inferencia QVAC, revisión o aprobación de Google. El QR de la landing sigue entregando la APK0.3 anterior. El alta automática de verificadores continúa en preparación; no hay grupo ni API de altas operativos confirmados. No se publican correos de verificadores.
