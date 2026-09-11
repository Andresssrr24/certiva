# Interfaz Android de Certiva

La vista del cliente del portal usa un teléfono inspirado en Android actual: cámara circular, pantalla de inicio con iconos SVG, fondo vectorial local, barra de gestos y alertas con nombre de aplicación, contenido y acción. Es una simulación interactiva, no una captura del sistema ni una réplica certificada de un modelo comercial.

Al tocar una situación llega primero la notificación del canal; el análisis en segundo plano publica después la alerta de Certiva. Solo tocar esa alerta abre el resultado. El fondo y los iconos se empaquetan localmente; no requieren servicios de imágenes externos.

Las actividades Android nativas comparten `ProtectionStyle`: tipografía del sistema, botones con efecto ripple y altura mínima de 52 dp, superficies agrupadas, estado independiente de los cinco requisitos de protección y ayuda expandible. Se conservan la instalación del modelo QVAC, la autorización explícita y la preparación del reporte. Las notificaciones de la APK siguen siendo notificaciones nativas de Android.

Referencia de diseño: [Material 3 Expressive de Android](https://blog.google/products-and-platforms/platforms/android/material-3-expressive-android-wearos-launch/). Se utiliza la identidad Certiva aprobada en MEMORIA_PROYECTO.md; la interfaz programática no depende de la librería Material Components.

## Validación de este cambio visual

- Nueve comprobaciones del recorrido de portal pasan en `scripts/prueba-experiencia.js`, con resultados de análisis controlados para probar la interfaz.
- Capturas de inicio, notificación, detalle y consola: `tmp/portal-*.png`.
- APK y APK de pruebas compilados; `lintDebug`: 0 errores y 18 advertencias. Registro: `tmp/android-modern/build.log`.
- La validación de QVAC en Android y la repetición del recorrido nativo corresponden a la integración 0.3 en curso. Compilar la interfaz no acredita un WhatsApp real recibido en un teléfono físico.

## Icono de notificación nativa

La alerta usa `ic_certiva_notification`, una adaptación vectorial monocroma de las dos piezas del símbolo, en la barra de estado y en su versión de pantalla bloqueada. El fondo queda transparente para que Android aplique su tinte. El cuerpo de la notificación incorpora como icono grande el PNG aprobado del lanzador. Reemplaza el anterior candado genérico del sistema.

Build y lint del cambio pasan. La prueba visual se registra por separado: un fallo del emulador o una prueba con contenido controlado no acreditan detección de WhatsApp real.
