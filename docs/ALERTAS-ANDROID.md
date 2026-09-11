# Certiva · alertas Android 0.2

## APK con alertas (Android 13 o posterior)

El proyecto está en `pilot/android-app/`. Compila la versión 0.2.0-protection; el APK de depuración se genera en `app/build/outputs/apk/debug/app-debug.apk`. El artefacto congelado de referencia se conserva fuera de Git en `pilot/artifacts/v0.2.0/`.

La APK utiliza el SDK compartido de reglas locales. **No incluye QVAC ni un modelo generativo móvil.** Detecta señales en el contenido que Android expone a `NotificationListenerService`, limitado a WhatsApp y WhatsApp Business. No abre conversaciones, lee el historial, intercepta transporte cifrado ni envía respuestas.

1. Instalar la APK en un Android de prueba.
2. Abrir Certiva y «Protección de WhatsApp y alertas».
3. Activar la protección después de leer la explicación.
4. Conceder el permiso para mostrar alertas y habilitar Certiva en el acceso a notificaciones de Android.
5. Volver a Certiva para comprobar que autorización, acceso, alertas y servicio aparecen disponibles.
6. Volver al inicio del teléfono. Mantener WhatsApp fuera del chat que recibirá el mensaje.
7. Desde otro teléfono, enviar un WhatsApp de prueba al dispositivo. Por ejemplo:

   > Su cuenta será bloqueada hoy. Envíe el código de verificación para desbloquearla.

8. Al llegar la alerta de Certiva, tocarla. Se muestran los motivos, los pasos recomendados y «Preparar reporte para el piloto».

La alerta es una **notificación local nativa** creada tras el análisis. No requiere FCM, servidor push ni internet adicional para detectar. WhatsApp sí requiere su conexión habitual para entregar el mensaje. No se envía una alerta de riesgo cuando el motor no encuentra señales.

### Reportar desde el teléfono al equipo

En el Mac, iniciar el servidor desde `pilot/`:

```sh
node server.js
```

El servidor conserva los accesos privados de cliente/analista/auditor en la ruta que imprime al iniciar. Consultar `pilot/README.md`. No publicar ese archivo.

Con el Android conectado por USB y autorizado para depuración:

```sh
adb -s <serial> install -r pilot/android-app/app/build/outputs/apk/debug/app-debug.apk
adb -s <serial> reverse tcp:4320 tcp:4320
```

Después de abrir una alerta, elegir «Preparar reporte para el piloto», ingresar como cliente, revisar los datos y confirmar el envío. En el escritorio, abrir los reportes de la APK e ingresar como analista. El reporte contiene los nueve campos del contrato del piloto, sin texto, teléfono, remitente, enlaces ni imágenes. La notificación por sí sola no envía un reporte al banco.

### Condiciones de la prueba

- Hace falta que WhatsApp publique una notificación con contenido legible. Un chat abierto, vista previa oculta, permisos denegados, perfil de trabajo o restricciones del sistema/fabricante pueden impedirlo.
- Android puede ocultar contenido sensible a los listeners. No se intenta evitar esa protección.
- «No molestar» o un canal silenciado puede impedir el aviso flotante aunque el resultado quede en el historial.
- La app ofrece desactivación, estado de permisos, última revisión y borrado del historial. Guarda como máximo 20 resultados con motivos y fechas; el texto y remitente no se escriben en disco. Los resultados de más de siete días se depuran al consultar el historial. No hay borrado programado garantizado mientras la app no se ejecuta.
- Es una APK de depuración para pruebas internas, sin distribución en Play Store. La política firmada es de desarrollo y necesita aprobación bancaria para un piloto institucional.

## Compilar y comprobar

```sh
cd pilot/android-app
./gradlew :app:assembleDebug :app:assembleDebugAndroidTest :sdk:assembleRelease :app:lintDebug
```

Para la instrumentación, usar un emulador dedicado y ejecutar las clases **por separado**. Instalar el APK de la app y el de pruebas; los tests cambian el estado de protección y generan alertas sintéticas. Desde la raíz, iniciar el backend aislado con `node pilot/test/android-server.js` en otra terminal y preparar el dispositivo:

```sh
adb -s <serial> install --no-streaming -r pilot/android-app/app/build/outputs/apk/debug/app-debug.apk
adb -s <serial> install --no-streaming -r pilot/android-app/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
adb -s <serial> shell pm grant local.certiva.pilot android.permission.POST_NOTIFICATIONS
adb -s <serial> reverse tcp:4321 tcp:4321
adb -s <serial> shell am instrument -w -e class local.certiva.pilot.ProtectionTest local.certiva.pilot.test/android.test.InstrumentationTestRunner
adb -s <serial> shell am instrument -w -e class local.certiva.pilot.ProtectionFlowTest local.certiva.pilot.test/android.test.InstrumentationTestRunner
adb -s <serial> shell am instrument -w -e class local.certiva.pilot.EngineTest local.certiva.pilot.test/android.test.InstrumentationTestRunner
adb -s <serial> reverse --remove tcp:4321
```

Detener el backend de pruebas al terminar. La demo conserva su puerto 4320; el backend de instrumentación usa 4321 y no persiste datos.

`ProtectionTest` inyecta una notificación sintética y comprueba filtrado, análisis, aviso nativo, deduplicación, desactivación y almacenamiento limitado. Una de sus cuatro pruebas es heredada de `ServiceTestCase`. `ProtectionFlowTest` comprueba apertura por `PendingIntent`, detalle y formulario de reporte; `EngineTest` verifica firma/motor y login/reporte/consulta. No equivalen a recepción real de WhatsApp desde otro teléfono.

Consultar [la evidencia de Android 0.2](../pilot/VALIDACION-ANDROID-0.2.md) para los resultados de la versión congelada y su diferencia con esta rama. La inferencia QVAC en Android continúa en una entrega posterior y no está incluida aquí.
