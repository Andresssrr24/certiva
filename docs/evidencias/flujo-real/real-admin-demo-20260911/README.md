# Evidencia del mismo caso: consola del piloto

- Caso: `8e8c15e5-8026-42de-8e51-44f2fa278697`. Assessment: `880ee912-881b-4190-a541-d60ea595c2fc`.
- Origen móvil: `../real-home-demo-20260911-05/result.json` (prueba aprobada; formulario real, reglas locales, consentimiento y POST reales).
- La consola real asignó y resolvió este caso mediante su interfaz. `backend-verification.json` verifica por lectura independiente el estado `resuelto`, responsable `analista`, conclusión `sin_evidencia`, versión 3 y los tres eventos del caso. Esta lectura no mutó el caso.
- **La instrumentación NO pasó**: agotó el tiempo al consultar mediante WebView el resultado final, después de las seis fases. `admin-demo-result.json` y `instrumentation.txt` conservan el fallo. La verificación independiente no lo convierte en aprobación.
- `admin-real-flow.mp4` es la grabación original finalizada, recuperada del emulador después de que saliera screenrecord. 83.699911 s, 1280 × 576, 41 frames; se revisó la hoja de contacto. Tiene tramos estáticos largos. ffprobe válido; decodificación con salida 0 y avisos de DTS repetidos. No se reconstruyó ni remuxeó.
- `admin-real-flow.partial.mp4` conserva la descarga prematura inválida; no usarla como vídeo.
- Los seis PNG documentan las fases. `result.json` añade hashes y límites a la evidencia original, sin cambiar `passed:false`.
- No hubo WhatsApp entrante real, teléfono físico ni inferencia QVAC Android verificada. El análisis móvil usó reglas locales y declaró IA no disponible.

El script de grabación se corrigió después de esta ejecución para esperar la salida del grabador y continuar extrayendo evidencia aunque falle una limpieza. Se comprobó la sintaxis; esa revisión del script no se volvió a ejecutar contra el caso.
