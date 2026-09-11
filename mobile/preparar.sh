#!/usr/bin/env bash
# Prepara la app móvil: crea el proyecto Expo con la plantilla oficial, instala dependencias con versiones
# alineadas al SDK 54, copia el núcleo compartido y nuestras pantallas. Idempotente: se puede volver a correr.
# Requisitos para compilar: Android Studio con SDK 35 y NDK, Java 17, un Android físico con depuración USB.
set -euo pipefail
cd "$(dirname "$0")"
RAIZ="$(cd .. && pwd)"
if [ ! -d app ]; then
  npx create-expo-app@latest app --template blank@sdk-54 --no-install
fi
cd app
npm install
npm install @qvac/sdk bare-rpc react-native-bare-kit
npm install -D bare-pack
npx expo install expo-file-system expo-build-properties expo-device expo-image-picker expo-clipboard expo-font
# núcleo compartido: idéntico al del escritorio
mkdir -p core
cp "$RAIZ/lib/reglas.js" "$RAIZ/lib/derivar.js" "$RAIZ/lib/esquemas.js" core/
cp "$RAIZ/data/banco-demo.json" "$RAIZ/data/politica-antifraude.md" core/
# nuestras pantallas y configuración
cp ../src/*.js ../src/*.jsx .
mkdir -p assets && cp ../assets/* assets/   # iconos y fuentes de la marca
cp ../app.config.js ../qvac.config.json .
rm -f app.json App.js   # la plantilla trae un App.js que taparía nuestro App.jsx
echo
echo "Listo. Siguiente: npx expo prebuild --platform android"
echo "Luego, con el teléfono conectado: npx expo run:android --device"
echo "En android/gradle.properties deja reactNativeArchitectures=arm64-v8a antes del release."
