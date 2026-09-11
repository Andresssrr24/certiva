# App móvil (Android, Expo)

La misma experiencia del teléfono de la demo, corriendo en un teléfono, con el mismo núcleo que el escritorio: `preparar.sh` copia `lib/reglas.js`, `lib/derivar.js`, `lib/esquemas.js` y `data/banco-demo.json` a `app/core/`. Sin descargar nada, el usuario pega el texto de un mensaje y el veredicto sale de las reglas. Leer capturas descarga VisionPsy una sola vez y corre en el teléfono. El APK no lleva modelos.

El plan, las mediciones de modelos y las compuertas están en [../docs/PLAN-APK.md](../docs/PLAN-APK.md).

## El APK

`dist/antifraude-release-arm64.apk`: 219 MB, solo arm64, Android 10 o superior, firmado con la llave de depuración. No va en el repositorio por peso; se comparte por enlace.

Qué pesa dentro, leído del APK:

| Pieza | MB |
|---|---|
| Backend Vulkan de ggml (GPU) | 86 |
| Runtime Bare con V8 | 62 |
| JavaScript en bytecode Hermes (app y worker del SDK) | 19 |
| Motor llama.cpp del SDK | 10 |
| RocksDB | 6 |
| Clases Java | 6 |
| Siete backends CPU de ggml (1,4 MB cada uno) | 10 |
| OpenCL (GPU Adreno) y resto | 6 |

Ninguna biblioteca lleva símbolos de depuración. Quitar Vulkan dejaría el APK en unos 133 MB con VisionPsy en CPU u OpenCL; el equipo prefirió conservar la GPU.

## Preparar y compilar sin Android Studio

Requisitos: Homebrew, Node 20 o superior, y una vez:

```bash
brew install openjdk@17 android-commandlinetools
sdkmanager --sdk_root="$HOME/Library/Android/sdk" "platform-tools" "platforms;android-36" "build-tools;36.0.0" "cmake;3.22.1"
```

El NDK 29.0.14206865 que fija el plugin de QVAC lo baja Gradle solo en la primera compilación.

```bash
./preparar.sh            # crea app/ con la plantilla oficial de Expo SDK 54, instala el SDK y copia el núcleo y las pantallas
./compilar.sh release    # expo prebuild + gradlew assembleRelease -> dist/antifraude-release-arm64.apk
adb install -r dist/antifraude-release-arm64.apk
```

`compilar.sh` exporta `JAVA_HOME` y `ANDROID_HOME` con los valores de Homebrew si no están definidos. La primera compilación tomó unos 25 minutos en un M4, casi todo descarga de Gradle y del NDK; las siguientes son incrementales.

Para desarrollar con recarga en caliente en un teléfono conectado por USB: `cd app && npx expo run:android --device`.

## Qué corre en el teléfono

- **Texto pegado:** `derivar` saca campos y `reglas.evaluar` decide, en menos de un milisegundo y sin red. Es el mismo código del escritorio.
- **Captura de pantalla:** VisionPsy transcribe la imagen en el teléfono (descarga única desde la app) y las mismas reglas deciden sobre el texto.
- **Consejo:** texto fijo por señal, tomado de la política del emisor (`src/consejos.js`). Qwen3 0.6B se midió y no mejora ese texto; Qwen3 4B, el redactor del escritorio, no cabe en un teléfono.
- **Nada sale del teléfono.**

## Estado

- Compilado el 10 de septiembre de 2026 en el MacBook, sin Android Studio.
- Emulador Android arm64 (API 35): prueba en curso, resultado en `docs/PLAN-APK.md`.
- Teléfono físico: pendiente del equipo. La primera prueba debe verificar la descarga de VisionPsy, `getModelInfo` para saber si el modelo quedó en caché, los permisos de galería y el tiempo al primer token.
