# Grabar el recorrido Android

`record-android-flow.cjs` ejecuta `ProtectionFlowTest` y registra la pantalla del emulador dedicado. No instala APK, activa protección, concede permisos ni envía WhatsApp.

Requisitos: APK y APK de pruebas de la misma compilación instalados, permiso de notificaciones ya concedido para el piloto, modelo listo y `ProtectionTest` aprobado antes de comenzar. Coordina el turno del emulador para no interrumpir otra prueba.

```sh
node pilot/scripts/record-android-flow.cjs emulator-5580 /ruta/app-debug.apk /ruta/evidencia-nueva
```

La carpeta debe ser nueva. Guarda MP4, capturas, resultado, registro de instrumentación y SHA-256 del APK. Comprueba que el APK instalado coincide con el archivo suministrado. Solo acepta emuladores; rechaza teléfonos físicos.

El recorrido sale de Certiva, publica una alerta del resultado sintético previamente evaluado, abre la cortina nativa y toca la notificación de Certiva. Después verifica el detalle y la preparación del reporte. No constituye evidencia de un WhatsApp real enviado entre dos teléfonos. Un fallo de instrumentación devuelve salida distinta de cero y queda registrado en `result.json`.

Para revisar únicamente la interfaz mientras el clasificador cambia, añade `--ui-fixture`. Ese modo ejecuta `UiFixtureFlowTest`, usa un resultado controlado y restaura el historial y la autorización al finalizar. El JSON identifica expresamente que no se ejecutó inferencia. No necesita un modelo instalado y no sustituye `ProtectionTest` ni una prueba con WhatsApp real.

`--ui-internal` graba una ruta independiente por Alertas recientes → Detalle → Preparar reporte → Volver. Usa el mismo resultado controlado y no prueba la cortina de notificaciones del sistema. El video se registra a 720 × 1600 y 1 Mbps. Los modos visuales restauran el historial al finalizar normalmente; un timeout detiene la app del emulador y conserva el fallo como evidencia, por lo que no debe tratarse como una toma aprobada.
