#!/usr/bin/env bash
# Compila el APK de release (arm64) sin Android Studio: JDK 17 y cmdline-tools de Homebrew, SDK en ~/Library/Android/sdk.
# Uso: ./compilar.sh [debug|release]   (por defecto release, firmado con la llave de depuración: suficiente para un hackatón)
set -euo pipefail
cd "$(dirname "$0")/app"
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
VARIANTE="${1:-release}"
# Sincroniza el código fuente con el repo: el núcleo compartido, las pantallas, los plugins y la configuración.
mkdir -p core plugins assets
cp ../../lib/reglas.js ../../lib/derivar.js ../../lib/esquemas.js core/
cp ../../data/banco-demo.json ../../data/politica-antifraude.md core/
cp ../src/*.js ../src/*.jsx .
cp ../plugins/*.js plugins/
cp ../assets/* assets/   # iconos y fuentes de la marca
cp ../app.config.js ../qvac.config.json .
npx expo prebuild --platform android --no-install   # idempotente: vuelve a aplicar los plugins sobre android/
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
# Solo arm64: el APK no carga cuatro arquitecturas.
grep -q '^reactNativeArchitectures=' android/gradle.properties \
  && sed -i '' 's/^reactNativeArchitectures=.*/reactNativeArchitectures=arm64-v8a/' android/gradle.properties \
  || echo 'reactNativeArchitectures=arm64-v8a' >> android/gradle.properties
# Sin R8 en release: con minify el arranque muere en TurboModuleRegistry.getEnforcing('PlatformConstants').
sed -i '' 's/^android.enableMinifyInReleaseBuilds=.*/android.enableMinifyInReleaseBuilds=false/; s/^android.enableShrinkResourcesInReleaseBuilds=.*/android.enableShrinkResourcesInReleaseBuilds=false/' android/gradle.properties
grep -q '^org.gradle.jvmargs=' android/gradle.properties || echo 'org.gradle.jvmargs=-Xmx4g' >> android/gradle.properties
cd android
if [ "$VARIANTE" = "debug" ]; then ./gradlew assembleDebug --no-daemon -q; SALIDA=app/build/outputs/apk/debug/app-debug.apk;
else ./gradlew assembleRelease --no-daemon -q; SALIDA=app/build/outputs/apk/release/app-release.apk; fi
mkdir -p ../../dist
cp "$SALIDA" "../../dist/antifraude-$VARIANTE-arm64.apk"
# Hash de referencia que instalar.sh verifica antes de instalar.
(cd ../../dist && shasum -a 256 "antifraude-$VARIANTE-arm64.apk" > "../antifraude-$VARIANTE-arm64.apk.sha256")
echo "APK: mobile/dist/antifraude-$VARIANTE-arm64.apk · $(du -h "../../dist/antifraude-$VARIANTE-arm64.apk" | cut -f1)"
