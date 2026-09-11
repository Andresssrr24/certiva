# Análisis del mensaje en el teléfono simulado

El portal analiza directamente el texto del escenario mediante `analizar-mensaje`. El proceso principal resuelve el identificador en su catálogo local. La captura sigue siendo ilustrativa; las imágenes subidas por el usuario mantienen VisionPsy y los contrastes OCR existentes.

Se eliminó la espera artificial de 900 ms antes del análisis. Para mensajes recibidos no se realiza transcripción ni segunda lectura de imagen: el cuerpo y los enlaces se conservan literalmente.

Si las reglas encuentran fraude o sospecha, se muestra una advertencia inicial antes de esperar a Qwen. Es un aviso de las reglas, no un resultado de IA terminado. El usuario puede abrirlo y ver las señales y el consejo preventivo. El reporte queda deshabilitado hasta terminar; una vista abierta se actualiza con el resultado final. No se anticipa ausencia de señales.

La explicación final mantiene Qwen, la recuperación de política y el mínimo de protección. La mejora elimina trabajo visual innecesario y adelanta la advertencia; no se afirma que la generación de Qwen sea instantánea. `tiempos.alerta_ms` distingue la primera advertencia del tiempo total.

## Validación

Integración del 11 de septiembre: **18 pruebas Node**, **12 comprobaciones de recorrido UI** y el recorrido de contactos aprobaron sobre la rama basada en `main`. Se conservaron las correcciones previas del SDK, el directorio de datos Certiva y los iconos del portal. La UI se verificó con Electron 40.10.2 y un backend controlado, sin inferencia. Registros: [Node](evidencias/certiva-hilos-node.txt), [recorrido](evidencias/certiva-hilos-ui.txt) y [contactos](evidencias/certiva-hilos-contactos-ui.txt).

Se archivaron las [31 mediciones nuevas de la sesión de desarrollo](evidencias/portal-perf-20260911.jsonl). Incluyen operaciones de distintos recorridos; no constituyen un benchmark controlado ni una medida de precisión.

- 15 pruebas Node aprobadas, incluidas conservación literal del texto, aviso antes de un generador pendiente, fallo de IA y protección ante resultados rebajados.
- 12 comprobaciones de interfaz con backend controlado: alerta durante la espera, reporte bloqueado, actualización del detalle abierto y flujo de casos.
- Estas pruebas no miden precisión ni latencia de QVAC. La captura subida conserva sus pruebas de segunda lectura.

Comandos: `node --test test/*.test.js` y `electron scripts/prueba-experiencia.js`.

## Comprobación real en el Mac

El 11 de septiembre de 2026 (UTC), el caso sintético de ejecutivo por WhatsApp se probó en el portal con Qwen3 4B local. La advertencia inicial apareció mientras el modelo todavía cargaba y el botón de reporte permaneció deshabilitado; el detalle abierto se actualizó al terminar.

- Primer análisis después de reiniciar: preparación de texto 5 ms; generación 6873 ms; total 13516 ms, incluyendo carga inicial.
- Repetición con el modelo cargado: preparación de texto 9 ms; reglas 4 ms; generación 8822 ms; total 9174 ms.
- El recorrido anterior del mismo escenario mostraba 15634 ms, incluyendo 4340 ms de lectura visual. Son observaciones individuales del Mac durante desarrollo, no un benchmark controlado ni una garantía para otros equipos.

La advertencia inicial no espera estos tiempos de generación. Se comprobó visualmente mediante la interfaz nativa. La explicación completa sigue tardando segundos.
