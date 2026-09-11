# Certiva Android 0.4 · Inicio y menú

Versión `0.4.0-menu-experimental`, versionCode 4, targetSdk 35. Validada en emulador Android 15/API35, pantalla 1080 × 2400 y densidad 420.

## Resultado final

- Compilación de APK y pruebas: aprobada.
- Lint: 0 errores, 24 advertencias.
- Seis pruebas nativas juntas: **6/6**, 56.98 s. [Salida](instrumentation.txt).
- Recorrido de las cuatro secciones con texto al 130 %: **1/1**, 24.452 s. [Salida](large-text-instrumentation.txt).
- Iconos y etiquetas de las cuatro celdas de navegación presentes en las cuatro capturas, con comprobación de píxeles. [Comprobación](navigation-pixel-check.json) y [metadatos](result.json).

Se comprobaron entrada vacía, ejemplo editable, texto compartido, conservación del borrador al navegar y recrear la actividad, botón Atrás, accesos a configuración/IA y apertura de una alerta guardada. La alerta controlada del test se restaura al terminar. Las capturas muestran el estado del emulador de pruebas, no acreditan recepción real de WhatsApp.

## Capturas

| Pantalla | Texto normal | Texto al 130 % |
| --- | --- | --- |
| Inicio | [Ver inicio](menu-home.png) | [Ver inicio ampliado](large-menu-home.png) |
| Verificar | [Ver revisión](menu-verify.png) | [Ver revisión ampliada](large-menu-verify.png) |
| Alertas | [Ver alertas](menu-alerts.png) | [Ver alertas ampliadas](large-menu-alerts.png) |
| Menú | [Ver menú](menu-account.png) | [Ver menú ampliado](large-menu-account.png) |

La barra conserva superficies opacas y se redibuja como una capa pequeña. Se retiró la pulsación HOME asíncrona de los tests para evitar que mandara una actividad recién abierta al fondo; la ejecución conjunta final pasa.

## Artefacto y alcance

APK local: `pilot/artifacts/menu-ui-20260911/certiva-0.4-menu-experimental.apk` (excluida de Git).

SHA-256: `8ee2f1d708149db3043e2de50b40df441116bf67244ed8ea654b0a63486b468f`.

Estas pruebas no ejecutan inferencia QVAC, no envían reportes y no validan conexión bancaria ni recepción física de WhatsApp. QVAC continúa experimental. La variante de publicación con targetSdk36 y firma se prepara por separado; estas evidencias corresponden a esta APK target35.

## Publicación del avance

APK, checksum y resultado de validación archivados en la [prerelease de avances](https://github.com/Andresssrr24/certiva/releases/tag/avances-2026-09-11), como `certiva-0.4-menu-experimental.apk`, su `.sha256` y `certiva-0.4-menu-validation.json`. Es la APK debug target35 de la ejecución final del commit fuente `4df8a7a`, de 41.003.835 bytes; no es el paquete de Google Play.

Al integrar sobre main se conservaron los 22 archivos de código/evidencia de ese commit sin cambios; el README se combinó con las publicaciones posteriores. Se verificaron los logs, hash de MainActivity, hash del APK y sus metadatos Android (versión 4, mínimo33, target35, ARM64). Se revisaron inicio y menú ampliado. No se repitió la instrumentación ni se reconstruyó el binario durante la publicación.
