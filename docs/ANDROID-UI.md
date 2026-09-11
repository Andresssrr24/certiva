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

## Inicio de la APK (revisión posterior)

MainActivity agrupa la portada en estado de protección, revisión manual y reportes. El encabezado incorpora el icono aprobado y el descriptor; la tarjeta de protección consulta modelo, autorización, acceso a notificaciones, alertas habilitadas y servicio conectado al volver a la pantalla. El formulario admite texto compartido, ejemplo editable y selección de canal. El botón no envía texto vacío ni permite una segunda revisión simultánea; muestra progreso, cierra el teclado y desplaza al resultado. Los resultados y el reporte voluntario conservan la distinción entre IA y reglas.

`HomeScreenTest` comprueba entrada vacía/ejemplo, navegación a protección y texto compartido sin ejecutar inferencia ni enviar reportes. La APK corresponde al avance experimental 0.3; este cambio de interfaz no valida QVAC ni recepción real de WhatsApp.

La revisión final del inicio pasó las dos pruebas de `HomeScreenTest` (14,678 s) y la inspección de capturas. [Resultado y hash de APK](evidencias/home-ui-20260911/result.json) · [Salida instrumentada](evidencias/home-ui-20260911/instrumentation.txt) · [Captura de inicio](evidencias/home-ui-20260911/home.png) · [Texto compartido](evidencias/home-ui-20260911/shared.png). Compilación app/tests y lint aprobados. La APK verificada se conserva como `certiva-0.3-home-experimental.apk` en la prerelease de avances; SHA-256 `21542a5afe71591a1327fb39878e8044adaf77dd7aaaec27d347465de7dec942`.

La copia integrada sobre `main` también pasó APK, APK de tests y lint en 30 segundos. Se reutilizaron los recursos nativos del runtime sin cambios. La prueba de interfaz citada pertenece a la APK congelada indicada arriba; no se atribuye a otro binario recompilado.
