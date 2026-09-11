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

## Instalar en un teléfono

`./instalar.sh` (o `./mobile/instalar.sh` desde la raíz) usa el APK de `dist/` o lo baja del Release `apk-v0.1`, verifica su SHA-256 contra `antifraude-release-arm64.apk.sha256`, y lo instala por USB si hay un teléfono con depuración activada (comprobando Android 10+ y arm64) o, si no, lo sirve por Wi-Fi con un QR en la terminal. `--usb` y `--wifi` fuerzan un camino; también acepta la ruta de otro APK. Las instrucciones para quien solo tiene el teléfono están en la sección «Instalar en un Android» del README principal.

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
- **Captura de pantalla:** VisionPsy Q8, el mismo lector del escritorio, transcribe la imagen en el teléfono (descarga única de 546 MB desde la app) y las mismas reglas deciden sobre el texto. Q4 se midió sobre las 136 capturas y pierde 4,4 puntos, así que no entra. Como en el teléfono no hay OCR de contraste, si la única evidencia es un dominio a una o dos letras del oficial, la app dice «sospechoso» y pide comparar el enlace letra por letra, en vez de afirmar fraude por lo que pudo ser una letra mal leída.
- **Consejo:** texto fijo por señal, tomado de la política del emisor (`src/consejos.js`). Qwen3 0.6B se midió y no mejora ese texto; Qwen3 4B, el redactor del escritorio, no cabe en un teléfono.
- **Nada sale del teléfono.**

## Estado

- Compilado el 10 de septiembre de 2026 en el MacBook, sin Android Studio. 228 MB.
- Emulador Android arm64 (API 35) en el MacBook: instala, arranca, y el modo texto funciona: un mensaje de fraude pegado da «Es una estafa» con las tres señales (dominio que imita al banco, petición de clave, prisa), el consejo y el canal oficial, en 1 ms. Capturas en `../docs/img/`.
- En el mismo emulador, VisionPsy Q8 se descargó desde la app (546 MB en unos 2,5 minutos), cargó y leyó capturas en CPU: la de fraude «bloqueo por enlace» dio «Es una estafa» con dominio ajeno y prisa, primer token a los 23 s y total 31 s; una legítima con enlace oficial dio «Sospechoso» porque el lector cambió letras del dominio y el teléfono no tiene OCR de contraste (la app pide comparar el enlace letra por letra). Con GPU de teléfono debería bajar mucho; ese número lo pone la prueba en un teléfono físico.
- Tres arreglos hicieron falta para llegar ahí, documentados en `plugins/` y en `../docs/PLAN-APK.md`: OpenCL declarada opcional (si no, el APK no instala donde no hay `libOpenCL.so`), precarga de `libappmodules.so` con el enlazador del sistema (SoLoader no encuentra `libnativehelper.so`, que `bare-kit` necesita, y la app moría al arrancar) y R8 apagado.
- Teléfono físico: pendiente del equipo. La primera prueba debe verificar la descarga de VisionPsy Q8, `getModelInfo` para saber si el modelo quedó en caché, los permisos de galería y el tiempo al primer token.
