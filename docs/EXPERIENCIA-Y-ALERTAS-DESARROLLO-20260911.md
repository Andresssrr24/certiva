> Snapshot de trabajo del 11 de septiembre. Conservado para trazabilidad: las instrucciones de pruebas no significan que sus recorridos estén aprobados. La referencia vigente es EXPERIENCIA-Y-ALERTAS.md y el estado experimental está en ../pilot/android-qvac/VALIDATION.md.

# Certiva · teléfono, alertas y centro de seguridad

El portal de Electron empieza en la pantalla de inicio de un teléfono simulado. Elegir un caso entrega el mensaje fuera de Certiva, ejecuta el motor QVAC de escritorio y presenta una notificación dentro del teléfono. Tocar esa notificación abre las señales, el consejo y el botón de reporte. El indicador inferior vuelve al inicio del teléfono.

Los mensajes del menú son ficticios. La inferencia del portal es real cuando los modelos están disponibles. El simulador no es un emulador Android ni recibe WhatsApp: para esa prueba se usa la APK.

## Portal

Desde la raíz del repositorio:

```sh
npm start
```

Solo ejecutar un motor QVAC a la vez. La primera revisión puede incluir carga y descarga de modelos. Los ejemplos se deshabilitan si faltan los modelos de visión y texto. Los detalles de modelos, señales, tiempos y JSON están en «Ver análisis y evidencia técnica».

### Centro de seguridad

- Generar casos sintéticos de enlace para robo de clave, solicitud de OTP, dispositivo nuevo o intentos repetidos.
- Seleccionar un caso, tomarlo, registrar solicitudes de verificación/cambio de clave/cierre de sesiones y resolver o descartar la revisión.
- Las solicitudes no ejecutan cambios en un banco ni envían mensajes al cliente. No hay conexión al core bancario.
- El historial y estado se conservan en `casos-piloto.json`, en el directorio de datos de la aplicación Electron. No guarda texto del mensaje. Es un registro local de demostración, sin autenticación de analistas ni garantía de inmutabilidad.
- Los indicadores de pares existentes siguen disponibles en «Inteligencia compartida».
- «Abrir reportes de la APK» abre la consola autenticada en `http://127.0.0.1:4320`. Los reportes reales del piloto móvil se gestionan allí con sus roles, control de concurrencia y auditoría. Se mantienen separados de los casos sintéticos locales de Electron.

## APK con alertas (Android 13 o posterior)

Archivo de entrega: `pilot/artifacts/v0.2.0/certiva-protection-0.2.0-debug.apk`.

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
adb install -r pilot/artifacts/v0.2.0/certiva-protection-0.2.0-debug.apk
adb reverse tcp:4320 tcp:4320
```

Después de abrir una alerta, elegir «Preparar reporte para el piloto», ingresar como cliente, revisar los datos y confirmar el envío. En el escritorio, abrir los reportes de la APK e ingresar como analista. El reporte contiene los nueve campos del contrato del piloto, sin texto, teléfono, remitente, enlaces ni imágenes. La notificación por sí sola no envía un reporte al banco.

### Condiciones de la prueba

- Hace falta que WhatsApp publique una notificación con contenido legible. Un chat abierto, vista previa oculta, permisos denegados, perfil de trabajo o restricciones del sistema/fabricante pueden impedirlo.
- Android puede ocultar contenido sensible a los listeners. No se intenta evitar esa protección.
- «No molestar» o un canal silenciado puede impedir el aviso flotante aunque el resultado quede en el historial.
- La app ofrece desactivación, estado de permisos, última revisión y borrado del historial. Guarda como máximo 20 resultados con motivos y fechas; el texto y remitente no se escriben en disco. Los resultados de más de siete días se depuran al consultar el historial. No hay borrado programado garantizado mientras la app no se ejecuta.
- Es una APK de depuración para pruebas internas, sin distribución en Play Store. La política firmada es de desarrollo y necesita aprobación bancaria para un piloto institucional.

## Compilación y comprobaciones

```sh
# Raíz: reglas, abstención y persistencia/transiciones de los casos
npm test

# Raíz: recorrido UI con motor controlado, sin cargar modelos QVAC
npx electron scripts/prueba-experiencia.js

# Android: compilar app, tests y revisar lint
cd pilot/android-app
./gradlew :app:assembleDebug :app:assembleDebugAndroidTest :app:lintDebug
```

Para la prueba instrumentada de alertas: instalar APK de app y AndroidTest en un emulador dedicado, conceder `POST_NOTIFICATIONS` a la app de prueba y ejecutar:

```sh
adb shell am instrument -w -e class local.certiva.pilot.ProtectionTest local.certiva.pilot.test/android.test.InstrumentationTestRunner
```

La prueba inyecta un `StatusBarNotification` sintético en el servicio; verifica extracción, filtrado, análisis nativo, alerta del sistema, destino de `PendingIntent`, deduplicación, desactivación y minimización/retención del resultado. No equivale a haber recibido un WhatsApp real desde otro teléfono. La prueba física debe registrar Android/fabricante, permisos, contenido visible, recepción, alerta y apertura de detalle.

Referencias de implementación: [NotificationListenerService](https://developer.android.com/reference/android/service/notification/NotificationListenerService) y [permiso de notificaciones](https://developer.android.com/develop/ui/views/notifications/notification-permission).

Para comprobar además la navegación de la alerta hacia detalle y reporte, ejecutar `ProtectionTest` y después `ProtectionFlowTest` (misma invocación con `-e class local.certiva.pilot.ProtectionFlowTest`). Esta segunda prueba genera capturas en el directorio externo privado de la app y falla si detecta un diálogo de bloqueo de System UI. Para el contrato de reporte y SDK, mantener la prueba `EngineTest` con el servidor aislado 4321 descrito en `pilot/README.md`.
