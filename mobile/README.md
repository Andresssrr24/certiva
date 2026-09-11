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

## La app

Cuatro pestañas, como cualquier app que la gente ya sabe usar:

| Pestaña | Qué hace |
|---|---|
| **Revisar** | Pega el mensaje o elige una captura. Debajo, las tres últimas revisiones. |
| **Historial** | Todo lo revisado en este teléfono, agrupado por día y filtrable por veredicto. |
| **Aprender** | Las 11 señales que busca el motor, cada una explicada con un ejemplo, más los canales oficiales del banco y qué hacer si ya compartiste algo. |
| **Ajustes** | Estado del lector de capturas, qué hace la app con tus datos, banco protegido y versión. |

El resultado de una revisión se abre encima: veredicto grande con su color, cada señal con su icono y la evidencia
que la disparó, los pasos a seguir, y los botones de llamar al banco y copiar el reporte. El botón físico de atrás
cierra el detalle y vuelve a Revisar, como en cualquier app Android.

La primera vez hay una bienvenida de tres pantallas que dice qué hace, dónde corre y qué no decide por ti. El
historial vive en un JSON de la carpeta privada de la app: no sale del teléfono y se borra al desinstalar.

Capturas en `../docs/img/apk-ui-*.png`.

## Marca

La app se llama **Certiva** en el lanzador y usa el símbolo Enlace como icono adaptativo: fondo blanco y símbolo en
el 66 % central del lienzo, el mismo margen que el icono nativo de `pilot/android-app` (PR #13,
[docs/ICONO-ANDROID.md](../docs/ICONO-ANDROID.md)). Expo lo genera desde `assets/icono-adaptativo.png`;
`assets/icono.png` es el icono cuadrado para iOS y lanzadores viejos, y `assets/marca.png` el símbolo de la
cabecera. Los tres derivan del mismo PNG aprobado,
`pilot/android-app/app/src/main/res/drawable-nodpi/certiva_launcher.png`. La letra es Manrope (OFL,
`assets/manrope-*.ttf`, la misma del escritorio) en cinco pesos, y la paleta es la de `renderer/certiva.css`. Los 30
iconos de `assets/ic-*.png` son PNG de alfa que se pintan con `tintColor`. El paquete Android sigue siendo
`pa.antifraude.movil`, así que el APK nuevo actualiza al anterior sin desinstalar. Esta app no envía notificaciones,
por lo que el icono de notificación del PR #15 no aplica aquí.

**«Sin señales» se pinta en azul, no en verde.** No encontrar señales no vuelve seguro un mensaje, y el verde lo
diría. Es la misma decisión del escritorio.

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
- 11 de septiembre: versión 0.3.0 con la app completa (cuatro pestañas, historial, aprender y ajustes), compilada y probada en el emulador arm64 API 35: la bienvenida, el recorrido de pegar un mensaje y ver el veredicto, el historial, el acordeón de señales y los ajustes funcionan; el botón físico de atrás cierra el detalle. 229 MB, SHA-256 `9a5165c4…5d4099`. Capturas en `../docs/img/apk-ui-*.png`.
- 11 de septiembre: versión 0.2.0 con la marca Certiva (nombre, icono adaptativo Enlace, firma en la cabecera, Manrope y azul #205094), compilada y probada en el mismo emulador: el cajón de aplicaciones muestra «Certiva» con el símbolo, la app abre con la firma debajo de la barra de estado, y un mensaje de fraude tecleado da «Es una estafa» con tres señales en 9 ms con un solo toque en «Verificar» (antes, con el teclado abierto, el primer toque solo lo cerraba). 229 MB, SHA-256 `2e5137bb…ab48f`. Capturas: `../docs/img/apk-certiva-cajon.png`, `apk-certiva-inicio.png` y `apk-certiva-veredicto.png`. Pendiente: publicarla como Release `apk-v0.2` y actualizar el hash que verifica `instalar.sh`.
- Emulador Android arm64 (API 35) en el MacBook: instala, arranca, y el modo texto funciona: un mensaje de fraude pegado da «Es una estafa» con las tres señales (dominio que imita al banco, petición de clave, prisa), el consejo y el canal oficial, en 1 ms. Capturas en `../docs/img/`.
- En el mismo emulador, VisionPsy Q8 se descargó desde la app (546 MB en unos 2,5 minutos), cargó y leyó capturas en CPU: la de fraude «bloqueo por enlace» dio «Es una estafa» con dominio ajeno y prisa, primer token a los 23 s y total 31 s; una legítima con enlace oficial dio «Sospechoso» porque el lector cambió letras del dominio y el teléfono no tiene OCR de contraste (la app pide comparar el enlace letra por letra). Con GPU de teléfono debería bajar mucho; ese número lo pone la prueba en un teléfono físico.
- Tres arreglos hicieron falta para llegar ahí, documentados en `plugins/` y en `../docs/PLAN-APK.md`: OpenCL declarada opcional (si no, el APK no instala donde no hay `libOpenCL.so`), precarga de `libappmodules.so` con el enlazador del sistema (SoLoader no encuentra `libnativehelper.so`, que `bare-kit` necesita, y la app moría al arrancar) y R8 apagado.
- Teléfono físico: pendiente del equipo. La primera prueba debe verificar la descarga de VisionPsy Q8, `getModelInfo` para saber si el modelo quedó en caché, los permisos de galería y el tiempo al primer token.
