# Plan del APK ligero

Objetivo: una app Android instalable de unas decenas de megas que corra el mismo motor anti-fraude en el teléfono, con inferencia local, y que sirva de prueba de que el motor se embebe. No sustituye a la app de escritorio, que sigue siendo la demo y el radar del banco.

## Principios

1. **El APK no lleva modelos.** Lleva el código, el SDK de QVAC y sus binarios nativos. Los modelos se descargan una vez, con barra de progreso y explicación, y quedan en el almacenamiento de la app.
2. **Ligero por defecto, capaz bajo demanda.** Sin descargar nada, la app ya sirve: el usuario pega o comparte el texto de un mensaje y el veredicto sale de las reglas, al instante. Leer capturas de pantalla exige un modelo de visión y se ofrece como descarga opcional.
3. **El mismo núcleo que el escritorio.** `lib/reglas.js`, `lib/derivar.js`, `lib/esquemas.js` y `data/banco-demo.json` se copian tal cual a la app móvil. Lo que decide el veredicto es idéntico en las dos plataformas; lo que cambia es quién lee la imagen y quién redacta el consejo.
4. **Solo modelos con resultados medidos.** Ningún modelo entra al plan sin una medición en nuestro set. Las mediciones se hacen en el MacBook como aproximación y se repiten en el teléfono cuando exista el APK.

## Qué corre en el teléfono y qué no

| Función | Teléfono | Laptop o banco |
|---|---|---|
| Veredicto por reglas sobre texto pegado o compartido | Sí, sin modelo | — |
| Lectura de capturas | Sí, con VisionPsy Q8 descargado una vez (546 MB) | — |
| Consejo y canal oficial | Texto fijo por tipo de señal, tomado de la política del emisor | Qwen3 4B redacta y la política se recupera con RAG |
| Modo llamada | No en esta versión | Parakeet en la laptop |
| Pares y radar | No en esta versión: el teléfono genera los hashes y los entrega al anfitrión | Hyperswarm y radar |

## Modelos: tamaño y evidencia

| Modelo | Descarga | Qué aporta | Evidencia |
|---|---|---|---|
| Reglas | 0 MB | El veredicto completo | 136 de 136 sobre el texto verdadero; el motor de escritorio las usa como base del veredicto |
| VisionPsy Nano 460M Flash Q4_K_M + proyector Q8 | 303 + 109 MB | Leer la captura en el teléfono | **Medido y descartado.** Sobre las 136 capturas, veredicto por reglas sobre la lectura: 123/136 (90,4 %) con Q4 frente a 129/136 (94,9 %) con Q8, con la misma latencia (1,2 a 1,5 s al primer token, 1,7 a 2,1 s por captura en el M4). Pierde 4,4 puntos y la compuerta eran 2. Sus fallos son letras cambiadas en el dominio oficial («bancodesmo», «banccodemo») y enlaces omitidos |
| VisionPsy Flash Q8 + proyector | 437 + 109 MB | **El lector del teléfono**, el mismo del escritorio | Medido: 129/136 en la misma prueba. Descarga única de 546 MB desde la app |
| Qwen3 0.6B | 382 MB | Redactar el consejo | **Medido y descartado.** En 8 veredictos acierta 7, pero solo porque repite la base de las reglas, que el piso de seguridad impone de todos modos; el consejo que redacta es pobre: «Cuelgue» ante un SMS, «fraude» como acción, confianza 0 en 6 de 8, mediana de 1,3 s. El texto fijo por señal de `consejos.js` es mejor y pesa 0 MB |
| Qwen3 1.7B | 1.057 MB | Redactar mejor | Fuera por peso |
| OCR clásico del SDK | 98 MB | Leer capturas sin modelo Psy | Descartado: 7 a 9 s en el M4, más lento en teléfono, y no es Psy |

Por debajo de unos 250 MB no existe modelo de visión que lea texto; lo que hay por debajo es OCR. Ese es el piso, y hay que decirlo así.

**Peso medido:** el APK de release compilado solo para arm64 pesa **219 MB** sin ningún modelo dentro. La estimación inicial de 50 a 80 MB era incorrecta. El desglose, leído del APK: backend Vulkan de ggml 86 MB, runtime Bare con V8 62 MB, paquete JavaScript en bytecode Hermes 19 MB, motor llama.cpp 10 MB, RocksDB 6 MB, clases Java 6 MB, siete variantes del backend CPU de ggml de 1,4 MB cada una, OpenCL 3 MB. Ninguna biblioteca lleva símbolos de depuración: `llvm-strip` no les quita un byte. La única palanca grande es quitar el backend Vulkan (86 MB), que el motor carga dinámicamente y sin el cual VisionPsy correría en CPU o en OpenCL sobre Adreno: el APK bajaría a unos 133 MB. Decisión del equipo: 220 MB es aceptable si los modelos que corren son buenos, así que el APK entregado conserva Vulkan. La descarga opcional del lector de capturas va aparte: 546 MB, VisionPsy Q8 y su proyector, la misma pareja que el escritorio.

## Arquitectura de la app móvil

- **Expo SDK 54, JavaScript, `@qvac/sdk` con `react-native-bare-kit`.** Android mínimo 29. La app instala y corre en el emulador arm64 (API 35) del MacBook: el modo texto quedó verificado ahí; la inferencia con GPU exige un teléfono físico.
- **Tres arreglos que hicieron falta para que el APK de release instale y arranque**, cada uno como plugin de Expo en `mobile/plugins/` o como propiedad de compilación, con la evidencia en el commit: (1) el plugin de QVAC declara `libOpenCL.so` como biblioteca obligatoria y el APK no instala donde no existe (emulador, teléfonos con GPU Mali): se declara opcional; (2) `libappmodules.so` enlaza `libbare-kit.so`, que necesita `libnativehelper.so`, una biblioteca pública que vive en el APEX de ART y que SoLoader no encuentra, así que descartaba los módulos nativos y la app moría al arrancar con «PlatformConstants could not be found»: se precarga con el enlazador del sistema en `MainApplication`; (3) R8 apagado en release porque el plugin de QVAC lo enciende y complicaba el diagnóstico; cuesta unos 9 MB.
- **`mobile/preparar.sh`** crea el proyecto Expo con la plantilla oficial, instala dependencias con `npx expo install` para no adivinar versiones, copia el núcleo compartido y nuestras pantallas, y deja el proyecto listo para `prebuild`.
- **Pantallas:** Inicio con dos acciones; Texto, donde el usuario pega el mensaje; Captura, que pide la imagen a la galería; Descarga del modelo, opcional; Resultado, el mismo veredicto del teléfono de la demo. Sin pestañas de banco: eso vive en la laptop.
- **Motor móvil (`src/motor.js`):** con modelo, VisionPsy transcribe y `derivar` saca los campos; sin modelo, el texto pegado pasa directo a `derivar`. En ambos casos `reglas.evaluar` decide y `consejos.js` pone el texto fijo por señal. El resultado y los hashes de indicadores se muestran; enviarlos a un anfitrión queda para después.
- **Datos que salen del teléfono:** ninguno. Cuando exista la integración, solo hashes y la bandera de coacción.

## Cómo se compila

Sin Android Studio. El toolchain se instala con Homebrew y `sdkmanager`, y dos scripts hacen el resto.

1. `brew install openjdk@17 android-commandlinetools` y `sdkmanager --sdk_root=$HOME/Library/Android/sdk "platform-tools" "platforms;android-36" "build-tools;36.0.0" "cmake;3.22.1"`. El NDK 29.0.14206865 que fija el plugin de QVAC lo baja Gradle solo en la primera compilación.
2. `cd mobile && ./preparar.sh`: crea `app/` con la plantilla oficial de Expo SDK 54, instala `@qvac/sdk`, `react-native-bare-kit`, `bare-rpc` y `bare-pack`, y copia el núcleo compartido y las pantallas.
3. `./compilar.sh release`: corre `expo prebuild` (el plugin de QVAC fija arm64 y el NDK, y genera el paquete del worker recortado al plugin `llamacpp-completion` que declara `qvac.config.json`) y luego `gradlew assembleRelease`. El APK queda en `mobile/dist/antifraude-release-arm64.apk`. La primera compilación tomó unos 25 minutos en el M4, casi todo descarga de Gradle y del NDK.
4. Instalar: `adb install -r mobile/dist/antifraude-release-arm64.apk`. Firmado con la llave de depuración, que basta para un hackatón; Android 10 o superior, solo arm64.
5. Primera prueba en el teléfono: pegar un texto de fraude y ver el veredicto sin descargar nada. Después, descargar VisionPsy desde la app y analizar una captura de `data/capturas/` pasada al teléfono; el tiempo al primer token va al README.

## Criterios de aceptación

- APK sin modelos dentro. Peso medido: 219 MB, aceptado por el equipo a cambio de conservar el backend GPU.
- Sin descargar nada, un texto de fraude pegado da veredicto en menos de un segundo.
- Con VisionPsy Q8 descargado, una captura de la demo da veredicto en menos de 10 s en un teléfono de gama media, sin red. Medido hasta ahora solo en el emulador, en CPU: 31 a 43 s por captura; la cifra con GPU de teléfono sigue pendiente.
- Las 136 capturas dan el mismo veredicto por reglas que en el escritorio con el mismo lector.
- Con el modo avión, todo sigue funcionando.

## Orden de trabajo y compuertas

| Paso | Dónde | Compuerta | Estado |
|---|---|---|---|
| Medir VisionPsy Q4 contra Q8 | MacBook | Si pierde más de 2 puntos, el teléfono usa Q8 y la descarga sube a 546 MB | Hecho sobre las 136: Q4 123/136, Q8 129/136. El teléfono usa Q8 |
| Medir Qwen3 0.6B en ocho veredictos | MacBook | Si el consejo no supera al texto fijo, no entra | Hecho: no entra |
| Preparar el proyecto Expo con `preparar.sh` | MacBook, toolchain por Homebrew | Si el prebuild no pasa en una hora, se para | Hecho |
| APK de release | MacBook | Se mide el peso y se decide | Hecho: 228 MB sin R8 (219 con R8), se conserva la GPU |
| Instalar y abrir en un Android | Emulador arm64 en el MacBook; después un teléfono del equipo | Es el mínimo para decir «corre en un teléfono» | Emulador: instala, arranca, y un texto de fraude pegado da «Es una estafa» con tres señales en 1 ms. Teléfono físico: pendiente del equipo |
| Descargar VisionPsy y leer una captura en el teléfono | Emulador arm64 (CPU, sin GPU); después un teléfono físico | El tiempo al primer token va al README y al video | Emulador: la descarga de 546 MB desde la app tardó unos 2,5 minutos; el modelo carga; la captura de fraude «bloqueo por enlace» dio «Es una estafa» (dominio ajeno y prisa) con primer token a los 23 s y total 31 s; una legítima con enlace oficial dio «Sospechoso» porque VisionPsy cambió letras del dominio y en el teléfono no hay OCR de contraste. Teléfono físico con GPU: pendiente del equipo |

**Lo que no cambia:** el video y la entrega no dependen del APK. Si el APK no llega a probarse en un teléfono físico, el proyecto se entrega igual y queda declarado como compilado y probado en emulador.
