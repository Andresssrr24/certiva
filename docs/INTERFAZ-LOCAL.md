# Certiva: interfaz local

La aplicación de escritorio usa la identidad aprobada en `MEMORIA_PROYECTO.md`: azul `#205094`, blanco, símbolo Enlace 03, firma compacta y descriptor «Tu aliado contra el fraude».

La capa visual está en `renderer/certiva.css`. El símbolo utiliza la lámina v5 como sprite para conservar el diseño aprobado mientras se produce el master vectorial. Manrope se sirve desde `renderer/assets/`, con licencia OFL incluida; no requiere CDN.

## Inicio habitual

Con las dependencias del proyecto instaladas:

```sh
npm start
```

La interfaz abre una ventana nativa de Electron, no un servidor HTTP. Para analizar capturas o llamadas también hacen falta el SDK QVAC y sus modelos. Las instrucciones de instalación y descarga siguen en el README del proyecto.

## Estado del entorno local

Las dependencias QVAC 0.19.0 y los modelos VisionPsy Nano 460M Flash + Qwen3 4B están instalados. La interfaz consulta el catálogo local y deshabilita las acciones cuyos modelos faltan. El modelo Parakeet de voz aún no está descargado.

El ejecutable Electron 42.5.0 declarado en el proyecto todavía no está disponible en `node_modules/electron/dist`. Para esta verificación se utilizó Electron 40.10.2 del caché local. Mientras exista el runtime temporal, desde la raíz:

```sh
PARES=0 SIN_RAG=1 /tmp/certiva-runtime/preview/Electron.app/Contents/MacOS/Electron .
```

`PARES=0` desactiva intercambio entre nodos. `SIN_RAG=1` omite recuperación de políticas con EmbeddingGemma, que no está descargado; las reglas y el consejo local siguen funcionando. No ejecutar simultáneamente este motor y el puente QVAC de la landing: coordinar la pausa del puente antes de iniciar un análisis de escritorio.

## Verificación de escritorio con inferencia real

Evidencia: `tmp/desktop-qvac/`, ejecución del 11 de septiembre de 2026 UTC (10 de septiembre en Panamá), Apple M1 Pro de 16 GB.

- Captura sintética: `data/capturas/fraude-bloqueo_enlace-01.png`, Banco Demo.
- Flujo real Electron → IPC → VisionPsy → reglas → Qwen3 → resultado en pantalla.
- Resultado: señales de estafa; tiempo total 23,042 ms, incluida carga de modelos.
- Inferencia de visión: 2,309 ms; generación del consejo: 7,768 ms.
- El registro anterior en la raíz de `tmp/desktop-qvac/` fue sobrescrito por repeticiones interactivas; no usar ese conjunto como evidencia final ni asociarlo a los tiempos de la primera prueba. Las capturas también preceden al ajuste que retira el teléfono ficticio.
- A partir del siguiente reinicio, la evidencia usa subdirectorios únicos por sesión y análisis: `<sesión>/inicio/01-inicio.png` y `<sesión>/analisis-N/{02-analizando.png,03-resultado.png,resultado.json}`. No navegar ni iniciar otra verificación hasta que aparezca el mensaje de captura guardada.
- Limitación observada: el lector transcribió `banccodemo-pa.app` donde la imagen dice `bancodemo-pa.app`. El resultado sospechoso coincide con el caso, pero esto no acredita lectura exacta de dominios ni precisión general del detector.
- Sin prueba de voz, RAG, pares ni Android. Las cuatro pruebas HTTP de la landing son evidencia independiente.

Para registrar otra ejecución sintética, con el motor reservado:

```sh
PARES=0 SIN_RAG=1 PERF_LOG=/tmp/certiva-desktop-perf.jsonl \
DEMO_AUTO=fraude-bloqueo_enlace-01 DEMO_EVIDENCIA_DIR=tmp/desktop-qvac \
/tmp/certiva-runtime/preview/Electron.app/Contents/MacOS/Electron .
```

La evidencia automática requiere ambas variables `DEMO_AUTO` y `DEMO_EVIDENCIA_DIR`; el JSON se guarda solo cuando se analiza la captura sintética indicada. No habilitar estas variables para uso normal con mensajes personales.

Las ocho pruebas automatizadas existentes pasaron, junto con la comprobación de sintaxis y formato de los cambios.
