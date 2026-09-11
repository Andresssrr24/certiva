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
| Lectura de capturas | Sí, con VisionPsy Q4 descargado | — |
| Consejo y canal oficial | Texto fijo por tipo de señal, tomado de la política del emisor | Qwen3 4B redacta y la política se recupera con RAG |
| Modo llamada | No en esta versión | Parakeet en la laptop |
| Pares y radar | No en esta versión: el teléfono genera los hashes y los entrega al anfitrión | Hyperswarm y radar |

## Modelos: tamaño y evidencia

| Modelo | Descarga | Qué aporta | Evidencia |
|---|---|---|---|
| Reglas | 0 MB | El veredicto completo | 136 de 136 sobre el texto verdadero; el motor de escritorio las usa como base del veredicto |
| VisionPsy Nano 460M Flash Q4_K_M + proyector Q8 | 303 + 109 MB | Leer la captura en el teléfono | **Pendiente de medir** contra Q8 en el MacBook: mismo set, mismas reglas. Se acepta si el veredicto por reglas se mantiene dentro de 2 puntos del Q8 |
| VisionPsy Flash Q8 + proyector | 437 + 109 MB | Referencia: 98,3 % de exactitud en la corrida de 120 | Medido |
| Qwen3 0.6B | 382 MB | Redactar el consejo | **Pendiente de medir**: si no mejora el consejo fijo, no entra |
| Qwen3 1.7B | 1.057 MB | Redactar mejor | Fuera por peso |
| OCR clásico del SDK | 98 MB | Leer capturas sin modelo Psy | Descartado: 7 a 9 s en el M4, más lento en teléfono, y no es Psy |

Por debajo de unos 250 MB no existe modelo de visión que lea texto; lo que hay por debajo es OCR. Ese es el piso, y hay que decirlo así.

**Presupuesto de peso:** APK de 50 a 80 MB compilado solo para arm64 (estimación, se mide en la primera compilación); descarga opcional de unos 410 MB para el lector de capturas. Nada más.

## Arquitectura de la app móvil

- **Expo SDK 54, JavaScript, `@qvac/sdk` con `react-native-bare-kit`.** Dispositivo físico obligatorio: el SDK no corre en emulador. Android mínimo 29.
- **`mobile/preparar.sh`** crea el proyecto Expo con la plantilla oficial, instala dependencias con `npx expo install` para no adivinar versiones, copia el núcleo compartido y nuestras pantallas, y deja el proyecto listo para `prebuild`.
- **Pantallas:** Inicio con dos acciones; Texto, donde el usuario pega el mensaje; Captura, que pide la imagen a la galería; Descarga del modelo, opcional; Resultado, el mismo veredicto del teléfono de la demo. Sin pestañas de banco: eso vive en la laptop.
- **Motor móvil (`src/motor.js`):** con modelo, VisionPsy transcribe y `derivar` saca los campos; sin modelo, el texto pegado pasa directo a `derivar`. En ambos casos `reglas.evaluar` decide y `consejos.js` pone el texto fijo por señal. El resultado y los hashes de indicadores se muestran; enviarlos a un anfitrión queda para después.
- **Datos que salen del teléfono:** ninguno. Cuando exista la integración, solo hashes y la bandera de coacción.

## Cómo se compila

1. Máquina con Android Studio, SDK 35, NDK y Java 17. **Esta máquina no los tiene**, y bajarlos en la red actual toma horas: la compilación va en la laptop de quien ya los tenga.
2. `cd mobile && ./preparar.sh` y luego `cd app && npx expo prebuild --platform android`.
3. En `android/gradle.properties`, dejar `reactNativeArchitectures=arm64-v8a` para que el APK no lleve cuatro arquitecturas.
4. Con el teléfono conectado y depuración USB: `npx expo run:android --device`. Primera prueba: pegar un texto de fraude y ver el veredicto sin descargar nada.
5. Descargar VisionPsy desde la app y analizar una captura de `data/capturas/` pasada al teléfono. Anotar el tiempo al primer token: ese número va al README.
6. APK para compartir: `cd android && ./gradlew assembleRelease`; el archivo queda en `android/app/build/outputs/apk/release/`. Firmado con la llave de depuración basta para un hackatón.

## Criterios de aceptación

- APK por debajo de 80 MB.
- Sin descargar nada, un texto de fraude pegado da veredicto en menos de un segundo.
- Con VisionPsy Q4 descargado, una captura de la demo da veredicto en menos de 10 s en un teléfono de gama media, sin red.
- Las 136 capturas dan el mismo veredicto por reglas que en el escritorio con el mismo lector.
- Con el modo avión, todo sigue funcionando.

## Orden de trabajo y compuertas

| Paso | Dónde | Compuerta |
|---|---|---|
| Medir VisionPsy Q4 contra Q8 en el MacBook | Esta máquina, cuando el worker esté libre | Si pierde más de 2 puntos, el teléfono usa Q8 y la descarga sube a 545 MB |
| Medir Qwen3 0.6B en seis veredictos | Esta máquina | Si el consejo no supera al texto fijo, no entra |
| Preparar el proyecto Expo con `preparar.sh` | Laptop con Android Studio | Si el prebuild no pasa en una hora, se para |
| Correr en un Android físico con texto pegado | Esa laptop | Es el mínimo para decir «corre en un teléfono» |
| Descargar VisionPsy Q4 y leer una captura | Esa laptop | El tiempo al primer token va al README y al video |
| APK de release | Esa laptop | Enlace en el README |

**Lo que no cambia:** el video y la entrega no dependen del APK. Si la compuerta del prebuild no pasa, el proyecto se entrega igual y el APK queda como siguiente paso documentado.
