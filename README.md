# Anti-fraude en el dispositivo · Hackatón QVAC · ISD Summit 2026

> Nombre del proyecto pendiente. Repositorio provisional: https://github.com/Andresssrr24/antifraude-qvac (privado hasta la entrega). Este README se completa durante el hackatón; las secciones marcadas **(pendiente)** se llenan antes de la entrega.

Lee capturas de mensajes sospechosos y llamadas en vivo **en el teléfono del cliente**, con modelos locales de QVAC, y dice si es fraude, por qué y qué hacer. Ni el mensaje ni la llamada salen del dispositivo. Los indicadores confirmados se comparten entre pares sin servidor.

Tracks en los que compite: **Desafío General**, **Caja de Ahorros**, **QVAC Psy**.

## Base preexistente

Declaración obligatoria del hackatón. Este proyecto parte de código ajeno:

- **Andamiaje de Electron, puente IPC, catálogo de modelos y patrón de extracción con esquema JSON** tomados de `qvac-invoice-manager-demo` en [tetherto/qvac-examples](https://github.com/tetherto/qvac-examples), licencia Apache-2.0, © QVAC by Tether. Archivos derivados: `main.js`, `preload.js`, `lib/modelos.js`, `lib/analizar.js`. Se recortaron y adaptaron; el texto original de la licencia está en `vendor-notice/`.
- **Patrones consultados** en `qvac-voice-relay` (transcripción) y `qvac-desk-tidy-demo` (embeddings) del mismo repositorio.
- Todo lo demás se escribió durante el hackatón: reglas, esquemas, generador de datos sintéticos, evaluación, pares, interfaz.

## Modelos y hardware declarados

| Tarea | Modelo | Constante del SDK | Cuantización |
|---|---|---|---|
| Leer la captura | VisionPsy Nano 460M Flash (modelo Psy) | `VISIONPSY_NANO_460M_MULTIMODAL_Q8_0` + proyector | Q8_0 |
| Veredicto y explicación | Qwen3 4B Instruct | `QWEN3_4B_INST_Q4_K_M` | Q4_K_M |
| Transcripción de llamadas | Parakeet TDT 0.6B v3 | `PARAKEET_TDT_0_6B_V3_Q8_0` | Q8_0 |
| Embeddings del RAG | EmbeddingGemma 300M | `EMBEDDINGGEMMA_300M_Q4_0` | Q4_0 |

Hardware de desarrollo y demo: MacBook con Apple M4 y 16 GB de RAM, macOS. SDK `@qvac/sdk` 0.19. El objetivo del producto es el teléfono del cliente; los benchmarks de VisionPsy en teléfonos citados en la presentación son del fabricante del modelo, no medidos por este equipo **(pendiente: resultados propios si el Android con Expo llega)**.

## Reproducir

```bash
node -v                    # 22.17 o más
npx -y @qvac/cli doctor    # GPU, memoria, disco
npm install
node node_modules/electron/install.js   # si npm install no bajó el binario de Electron (pasa en redes lentas)
npm run modelos            # descarga los modelos a ~/.qvac/models (una vez, con internet)
npm run datos              # genera los mensajes sintéticos y renderiza las capturas
npm run prueba             # apaga el Wi-Fi primero: captura -> extracción -> reglas -> veredicto
npm start                  # la app
npm run eval               # métricas sobre el set sintético -> eval/results.md
node eval/reglas-check.js  # chequeo de las reglas sin modelos
```

Después de descargar los modelos, todo funciona sin red. El registro de rendimiento se escribe en `eval/perf.jsonl`.

## Cómo funciona

1. La captura de pantalla entra a **VisionPsy** con un esquema JSON obligatorio: canal, remitente, texto, enlaces, teléfonos, montos, si pide datos sensibles, urgencia.
2. **Reglas deterministas** (`lib/reglas.js`) producen evidencias en texto: dominio parecido al oficial, acortador, IP literal, punycode, número no oficial, petición de clave o código, presión de tiempo, pago a terceros.
3. **Qwen3 4B** recibe la extracción y las evidencias y redacta el veredicto con un segundo esquema: fraude, sospechoso, sin señales o no legible, con confianza, señales, acción y canal oficial. Nunca dice «seguro».
4. **(pendiente)** Modo llamada con transcripción local en vivo, RAG sobre la política anti-fraude, indicadores compartidos por pares con Hyperswarm y radar para el equipo de fraude.

## Datos

Ningún dato real. `data/banco-demo.json` define un banco ficticio con sus canales oficiales y los dominios parecidos que las reglas deben atrapar. `data/generar.js` produce mensajes de fraude y legítimos en español panameño con verdad conocida, y `data/render.js` los renderiza como capturas de SMS, WhatsApp y correo. Para un banco real se reemplaza el archivo del banco.

## Para el jurado de la Caja de Ahorros **(pendiente)**

Aplicabilidad, integración como función de la app del banco, modo sucursal, radar para el equipo de fraude, y por qué lo local es la ventaja.

## Para el reto QVAC Psy **(pendiente)**

Por qué VisionPsy es central por necesidad, métricas de calidad sobre el set sintético, registro de rendimiento, límites y manejo de riesgo.

## Para el desafío general **(pendiente)**

Problema, impacto con cifras de la SBP, innovación, uso de pares.

## Seguridad y límites

- La app nunca dice «seguro». Dice «no encontré señales» y repite que el banco nunca pide claves ni códigos.
- Nada se guarda ni sale del teléfono salvo que el usuario reporte, y el reporte lleva indicadores, no el mensaje.
- Puede fallar con tácticas nuevas. Ante la duda, llamar al número oficial impreso en la tarjeta.

## Modelo de negocio **(pendiente)**

## Licencia

Apache-2.0. Ver `LICENSE` y `NOTICE`.
