# App móvil (Android, Expo)

La misma experiencia del teléfono de la demo, corriendo en un teléfono. Ligera por defecto: sin descargar nada, el usuario pega el texto de un mensaje y el veredicto sale de las reglas. Leer capturas descarga VisionPsy Q4 una sola vez, unos 410 MB, y corre en el teléfono.

El plan completo, con los modelos medidos y las compuertas, está en `../docs/PLAN-APK.md`.

## Preparar y compilar

Requisitos: Android Studio con SDK 35 y NDK, Java 17, un Android físico con depuración USB. El SDK de QVAC no corre en emulador.

```bash
./preparar.sh                          # crea app/ con la plantilla oficial de Expo, instala y copia el núcleo
cd app
npx expo prebuild --platform android
# en android/gradle.properties: reactNativeArchitectures=arm64-v8a
npx expo run:android --device          # primera prueba: pegar un texto de fraude
cd android && ./gradlew assembleRelease   # APK en android/app/build/outputs/apk/release/
```

## Estado

Andamiaje sin compilar todavía: no hay toolchain de Android en la máquina de desarrollo. Las pantallas y el motor móvil están escritos contra la API del SDK que ya usa el escritorio; la primera compilación debe verificar `getModelInfo` para saber si el modelo está en caché y los permisos de galería.
