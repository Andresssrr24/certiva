# QVAC dentro de Android

**Experimental:** se publica el avance completo con sus fallos conocidos. La primera inferencia Android falló un caso positivo y las dos repeticiones del clasificador corregido agotaron el tiempo. Ver [VALIDATION.md](VALIDATION.md). Esta fuente no sustituye la APK 0.2 de reglas como versión de referencia.

Módulo nativo de Certiva: Bare Kit 2.4.3, QVAC `@qvac/llm-llamacpp` 0.49.1 y Qwen3 1.7B Q4_K_M. La inferencia ocurre en un hilo Bare del proceso Android. No usa el worker del Mac, API HTTP, RPC remoto ni pares P2P.

Android 13+, ABI arm64-v8a. El rendimiento y consumo deben medirse en el teléfono objetivo. Modelo: 1.107.409.472 bytes; SHA-256 `b139949c5bd74937ad8ed8c8cf3d9ffb1e99c866c823204dc42c0d91fa181897`. Cuantización de [Unsloth](https://huggingface.co/unsloth/Qwen3-1.7B-GGUF), basada en Qwen3 de Qwen. El modelo no va en Git. El instalador Android descarga por HTTPS y verifica tamaño y hash antes de habilitarlo.

## Construir

Desde esta carpeta:

```sh
npm ci
node scripts/bootstrap.cjs
node scripts/bundle.cjs
```

El bundle usa la dependencia QVAC ya instalada en la raíz del repositorio. Bare Kit y las bibliotecas generadas quedan en directorios ignorados por Git. El bootstrap verifica el hash publicado de Bare Kit. Después compilar el proyecto Android que incluya este módulo. La app anfitriona debe extraer las bibliotecas nativas (`packaging.jniLibs.useLegacyPackaging = true`).

## Prueba real aislada

`probe/` es una app Android separada (`local.certiva.qvacprobe`) que prueba tres mensajes sintéticos: petición de código, conversación cotidiana y aviso de no compartir códigos. Su manifiesto elimina **INTERNET** para demostrar que la inferencia no depende de servidores.

```sh
gradle -p probe assembleDebug
node scripts/provision.cjs SERIAL probe/build/outputs/apk/debug/CertivaQvacProbe-debug.apk /ruta/Qwen3-1.7B-Q4_K_M.gguf local.certiva.qvacprobe
adb -s SERIAL shell am start -n local.certiva.qvacprobe/local.certiva.probe.MainActivity
adb -s SERIAL shell run-as local.certiva.qvacprobe cat files/native-proof.json
```

La prueba devuelve las señales, duración, backend y errores. Compilar no demuestra que la inferencia haya funcionado. No contiene mensajes reales y no mide eficacia frente al fraude.

## Datos y límites

El clasificador recibe el texto en memoria, devuelve únicamente códigos de señales permitidos y nunca genera texto que se guarde como evidencia. No autentica remitentes. Tiene un límite conservador de 2.600 caracteres y se abstiene de analizar mensajes que lo exceden. Ejecuta CPU, con razonamiento acotado y salida validada antes de combinarla con las reglas. Carga bajo demanda y descarga pesos tras 60 segundos inactivo. Un fallo o tiempo excesivo se muestra como fallo de IA. Se conserva un riesgo previamente detectado por reglas, identificado explícitamente como tal; no se presenta una respuesta de reglas como inferencia QVAC.

El análisis de texto es local. Enviar reportes a la consola requiere un servicio de reportes. Este módulo no implementa captura de llamadas, OCR, lectura del historial de WhatsApp ni acceso a notificaciones sin autorización.

Fuentes de integración: [Bare Kit](https://github.com/holepunchto/bare-kit/tree/v2.4.3) y [QVAC LLM addon](https://github.com/tetherto/qvac/tree/main/packages/llm-llamacpp).

El estado de las comprobaciones y sus límites está en [VALIDATION.md](VALIDATION.md).
