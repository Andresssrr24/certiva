# Corrección tras feedback de Bryan

## Alcance actualizado: APK Android

Bryan recordó explícitamente que el proyecto también incluye un APK. El demo final debe priorizar la experiencia Android y mostrar el APK real cuando esté disponible. La captura Electron de esta muestra es provisional y no acredita una aplicación Android instalada. Mantener independientes las tareas de APK, landing y video.

Coordinación posterior: la tarea de landing recibió la reserva de instalación raíz y worker QVAC tras informar que se liberó espacio. No duplicar instalaciones ni inferencia desde video. La evidencia `tmp/landing-qvac/verification.json` ya fue leída desde esta tarea: registra cuatro casos sintéticos aprobados vía HTTP con SDK 0.19.0 en Apple M1 Pro de 16 GiB. Esto verifica ejecución en Mac; no acredita inferencia en Android ni una tasa de precisión general.

La tarea «Diseñar producto para banca y USDT» está implementando el piloto en `pilot/`, con una app iOS. Se le trasladó la indicación explícita de Bryan de incluir también APK Android y se solicitó ruta instalable y evidencia del motor empleado. La búsqueda actual del proyecto no encontró APK ni configuración Gradle. El título histórico de esa tarea no cambia el alcance vigente: USDT está excluido.

La v1 fue rechazada: planos abstractos generados sin representación fiel del producto ni demostración de la app. No usarla en la landing.

## Muestra corregida de dirección

Se produjo una muestra silenciosa de 20 s a 1920×1080, 24 fps, H.264, mediante composición nativa Higgsedit. Usa una captura real de la ventana Electron (`/tmp/certiva-local.png`, aportada por la tarea de la app), sin imágenes ni videos generados adicionales. Tipografía Manrope, azul #205094, recortes de la pantalla auténtica, entrada del teléfono, texto por palabras, transición a la app completa y acercamiento a sus ejemplos. No registra clics ni inferencia; se identifica como captura animada.

- [Muestra MP4](https://d2ol7oe51mr4n9.cloudfront.net/user_3GMObER4e0Coaiy1mp7s18g2XJP/6e9ba00a-00b0-461c-8050-1d315c9bdd20.mp4)
- [Fotogramas](https://d2ol7oe51mr4n9.cloudfront.net/user_3GMObER4e0Coaiy1mp7s18g2XJP/37bbb7ed-cd51-4ee5-82ed-336e7a0dcc85.png)
- [Proyecto editable](https://d2ol7oe51mr4n9.cloudfront.net/user_3GMObER4e0Coaiy1mp7s18g2XJP/ce765586-9c94-45ca-acec-ba782c3c94cc.zip)

Fuente reproducible: `motion-ui-v2.js`. No confundir esta prueba de dirección con la demo funcional pedida.

## Bloqueo anterior, superado en Mac

La ventana usada para la muestra mostraba que faltaban SDK y modelos QVAC tras una instalación fallida por espacio (4,2 GiB libres). Ese estado es histórico. El cierre de la muestra v2 que dice que falta instalar QVAC quedó desactualizado: no publicarlo como estado actual. El runtime temporal está en `/tmp/certiva-runtime/preview/Electron.app`, con pares desactivados.

Estado verificado posterior: Qwen3 4B y VisionPsy Nano 460M Flash instalados; puente de landing en `127.0.0.1:4318`. Casos medidos en Mac: phishing de texto 35,429 s (carga inicial), solicitud de código 20,588 s, aviso informativo 17,866 s y captura sintética Banco Demo 29,960 s. Voz y embeddings no preparados. La tarea de landing conserva el worker; coordinar su cesión antes de otra ejecución.

Para completar el video Android: obtener el APK, comprobar instalación y flujo, grabar entrada, análisis y resultado reales; incorporar esa grabación al proyecto nativo con tiempos/cortes identificados. Identificar el motor y dónde se ejecuta según la implementación comprobada. No trasladar al móvil las mediciones de Mac ni presentar maquetas como ejecución.

La v2 fue verificada en sus cuatro planos y en metadatos de exportación. No se modificó código de la app ni de la landing desde esta tarea.

## Evidencia posterior de escritorio: pendiente de captura coherente

Revisados `tmp/desktop-qvac/resultado.json` y `03-resultado.png`: ambos muestran una ejecución de 10.110 ms, con OCR `bancodeattoo.pa.app`. Difieren del aviso de entrega que indicaba 23.042 ms y otro texto OCR; no mezclar esas ejecuciones. La captura aún muestra el teléfono ficticio 800-1234, mientras el campo de canal oficial del JSON ya fue corregido. Este conjunto no está listo para montaje final. Solicitada evidencia nueva con nombres únicos y consistencia entre captura y resultado. No se controló la ventana, reservada para Bryan.
