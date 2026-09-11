# Demo visual Android con firma aprobada

Primer corte de interfaz: 23 s, 1920×1080, 24 fps, H.264, silencioso. Incluye motion graphics nativos y dos capturas reales animadas del APK moderno. No es una grabación continua ni una demostración de inferencia.

- [Video](https://d2ol7oe51mr4n9.cloudfront.net/user_3GMObER4e0Coaiy1mp7s18g2XJP/6c9602b9-373d-4f98-94de-6754ca3c051e.mp4)
- [Cuatro planos revisados](https://d2ol7oe51mr4n9.cloudfront.net/user_3GMObER4e0Coaiy1mp7s18g2XJP/4de23a3e-af8f-4185-a0e2-c05108f80f4d.png)
- [Proyecto editable](https://d2ol7oe51mr4n9.cloudfront.net/user_3GMObER4e0Coaiy1mp7s18g2XJP/a1c0fe6a-a203-4244-911a-e48e255a04db.zip)

## Logo

Por petición expresa de Bryan, reemplazado el encabezado tipográfico provisional por símbolo y firma completos de `docs/marketing/brand/certiva-aplicaciones-azul-v5.png`. Se usa un recorte nativo de la lámina aprobada, sin redibujar, estirar ni generar el lettering. Se conserva también el descriptor original dentro del recorte.

La copia de la landing usada para transferir el activo al render coincide byte por byte con la fuente local: SHA256 `9aebe45959cfe1060dfd74a249e0abadeb74dc5f2a9ee1bd414b642d943462cd`. No se afirma que exista un master vectorial. La firma aparece en las cuatro escenas y tiene mayor presencia al abrir y cerrar.

## Procedencia y límites

Inicio y notificación: `pilot/artifacts/ui-android-20260911-03/main.png` y `notification.png`. APK de esa ejecución: `29a28001e4d9942241468653c17a09a39e8e18be652ea00e2b9b5ee6b0f750d3`, versión 0.3.0-qvac-local.

La ejecución completa terminó en timeout al abrir la notificación. Por eso NO se utiliza su MP4 ni se presenta como prueba exitosa de extremo a extremo. Las dos pantallas limpias sí fueron observadas y confirmadas por la tarea de captura. El resultado de la notificación fue insertado por `UiFixtureFlowTest`; no hubo inferencia ni envío real de WhatsApp. El rótulo durante ambas escenas dice: «Capturas reales animadas · Resultado controlado de prueba · Sin inferencia».

Composición: `demo-visual-android.js`. Fuente para el futuro recorrido continuo: `assemble-demo.js`, que exige coincidencia de APK y ejecución aprobada. El render actual sustituye las piezas de marca sin símbolo para el montaje del demo. No publicar como demo funcional final.

Verificación: cuatro planos revisados visualmente; logo completo y alerta legible. ffprobe confirmó 23 s, 1920×1080 y 24 fps. MP4, PNG y ZIP subidos con HTTP 200 y confirmados.
