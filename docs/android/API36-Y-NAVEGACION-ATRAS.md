# Android API36 y navegación Atrás

La aplicación nativa conserva la interfaz 0.4 y sube `compileSdk` y `targetSdk` a 36; el mínimo sigue en API33. `MainActivity` registra `OnBackInvokedCallback` cuando se muestra Verificar, Alertas o Menú y lo retira al volver a Inicio o destruir la actividad. Así Atrás vuelve al inicio desde una sección y deja al sistema gestionar la salida desde la raíz.

La migración sustituye `onBackPressed`, que ya no se invoca para aplicaciones con target36 ejecutadas en Android16. [Cambios oficiales de Android16](https://developer.android.com/about/versions/16/behavior-changes-16), consultados el 11 de septiembre de 2026. El manifiesto habilita explícitamente el callback.

## Validación disponible

La tarea de preparación ejecutó dos pruebas nativas del dispatcher de Atrás y de recreación con borrador conservado: **2/2 en 20,813 s**, sobre un emulador **Android15/API35**. El target del APK era36. **No se probó Android16 ni su gesto predictivo**; esa validación sigue pendiente.

En su copia aislada pasaron bundleRelease, lintRelease y builds debug/test: 222 tareas, 27 s, lint 0 errores y 21 advertencias. [Log y resumen de evidencia](../evidencias/android-api36-20260911/result.json). El build de preparación utilizó configuración privada de firma que no forma parte de este PR. El repositorio conserva únicamente código, pruebas y documentación; no incluye claves ni bundles.

Al publicar se aplicó el patch sobre el menú final y se comprobó igualdad de MainActivity, manifiesto y test con los archivos probados. Se revisaron logs y se contaron las advertencias del XML de lint. No se repitieron compilación ni instrumentación durante la integración.

La APK debug target35 publicada como `certiva-0.4-menu-experimental.apk` continúa siendo un artefacto histórico con sus propias pruebas. No se reemplazó el QR ni ese archivo con esta preparación API36. La distribución en Google Play y la apelación de Play Protect se gestionan por separado; este cambio no acredita aprobación, publicación ni desbloqueo del teléfono.
