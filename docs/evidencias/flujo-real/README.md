# Formulario Android y administración del mismo caso

La prueba móvil aprobó el formulario real, análisis por reglas locales, consentimiento y envío al piloto: `RealHomeDemoTest`, 33,037 s. La IA se declaró no disponible; no hubo entrada real desde WhatsApp ni inferencia QVAC validada.

El caso `8e8c15e5-8026-42de-8e51-44f2fa278697` conserva el assessment `880ee912-881b-4190-a541-d60ea595c2fc` desde Android hasta la consola. La lectura independiente del backend confirmó asignación, resolución `sin_evidencia` y eventos de auditoría. **La instrumentación administrativa falló** al consultar el resultado final mediante WebView; la verificación independiente no convierte esa prueba en aprobada.

- [Resultado móvil](real-home-demo-20260911-05/result.json), log y capturas de consentimiento/recibo.
- [Resultado administrativo y límites](real-admin-demo-20260911/README.md), seis fases, log de fallo y lectura del backend.
- [Manifiesto de archivos y SHA-256](MANIFIESTO.json).
- [Grabaciones originales y evidencias en la release](https://github.com/Andresssrr24/certiva/releases/download/avances-2026-09-11/certiva-flujo-real-android-admin-20260911.zip).

La grabación móvil dura 20,0315 s; la administrativa recuperada dura 83,699911 s y tiene solo 41 frames, con tramos estáticos y avisos DTS documentados. El ZIP excluye la descarga parcial inválida. Son registros técnicos del flujo, no un montaje final de marketing. El repositorio es privado y la release requiere acceso autorizado.

## Repetición explícita

Los scripts `pilot/scripts/record-real-home-demo.py` y `record-admin-demo.py` operan sobre emulator-5580 y el piloto local en 4320. Requieren coordinar primero el emulador, la APK y la sesión con las otras tareas. Sus flags `--submit-demo-report` y `--resolve-demo-case` hacen explícitas las mutaciones de demostración. Obtienen credenciales del almacén privado local, no del repositorio; comienzan la grabación tras el acceso.

El script administrativo fue corregido después de la ejecución para esperar al grabador y recuperar evidencia aunque falle la limpieza. Se comprobó sintaxis Python; esa revisión no se volvió a ejecutar contra el caso. `UiInternalFlowTest` conserva su alcance de fixture controlado e incorpora la pantalla de inicio; no se confunde con la prueba real nueva.

En esta publicación se verificaron sintaxis Python, JSON, correspondencia de caso/assessment, hashes de ambos MP4 y metadatos ffprobe. Se revisaron la hoja de contacto administrativa y la captura de consentimiento. No se ejecutaron nuevas mutaciones ni instrumentación, y la APK productiva permanece en SHA-256 `21542a5afe71591a1327fb39878e8044adaf77dd7aaaec27d347465de7dec942`.
