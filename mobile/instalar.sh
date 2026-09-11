#!/usr/bin/env bash
# Instala el APK de Certiva en un Android por el camino que haya a mano:
#   - por USB, con adb, comprobando antes Android 10+ y procesador arm64;
#   - si no hay teléfono por cable, sirve el APK en la red Wi-Fi de esta máquina y muestra un QR para bajarlo desde el teléfono.
# Uso: ./mobile/instalar.sh            usa mobile/dist/antifraude-release-arm64.apk o lo baja del Release apk-v0.1
#      ./mobile/instalar.sh --wifi     fuerza el camino por Wi-Fi aunque haya un teléfono por USB
#      ./mobile/instalar.sh --usb      solo por USB; falla si no hay teléfono
#      ./mobile/instalar.sh ruta.apk   instala ese archivo
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"
REPO="Andresssrr24/certiva"
TAG="apk-v0.1"
NOMBRE="antifraude-release-arm64.apk"
APK="$AQUI/dist/$NOMBRE"
ADB="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"
command -v adb >/dev/null 2>&1 && ADB=adb
MODO=auto
for a in "$@"; do
  case "$a" in
    --wifi) MODO=wifi ;;
    --usb) MODO=usb ;;
    -h|--help) sed -n '2,8p' "$0"; exit 0 ;;
    *.apk) APK="$a" ;;
    *) echo "Argumento no reconocido: $a"; exit 2 ;;
  esac
done

# 1. Conseguir el APK: local, o del Release del repositorio.
if [ ! -f "$APK" ]; then
  echo "No encuentro $APK. Lo bajo del Release $TAG de $REPO (228 MB)…"
  mkdir -p "$(dirname "$APK")"
  if command -v gh >/dev/null 2>&1; then
    gh release download "$TAG" --repo "$REPO" --pattern "$NOMBRE" --dir "$(dirname "$APK")" --clobber
  else
    # Sin gh solo funciona con el repositorio público.
    curl -fL -o "$APK" "https://github.com/$REPO/releases/download/$TAG/$NOMBRE"
  fi
fi

# 2. Verificar la integridad contra el hash publicado en el repo.
if [ -f "$AQUI/$NOMBRE.sha256" ]; then
  ESPERADO="$(cut -d' ' -f1 "$AQUI/$NOMBRE.sha256")"
  REAL="$(shasum -a 256 "$APK" | cut -d' ' -f1)"
  if [ "$ESPERADO" != "$REAL" ]; then
    echo "El SHA-256 del APK no coincide con $NOMBRE.sha256 (¿APK recompilado sin actualizar el hash, o descarga cortada?)."
    echo "  esperado $ESPERADO"
    echo "  real     $REAL"
    exit 1
  fi
  echo "APK verificado · SHA-256 $REAL"
fi
TAM="$(du -h "$APK" | cut -f1)"

# 3. ¿Hay un teléfono por USB?
SERIE=""
if [ "$MODO" != wifi ] && command -v "$ADB" >/dev/null 2>&1; then
  SERIE="$("$ADB" devices 2>/dev/null | awk 'NR>1 && $2=="device" && $1 !~ /^emulator/ {print $1; exit}')"
  NOAUT="$("$ADB" devices 2>/dev/null | awk 'NR>1 && $2=="unauthorized" {print $1; exit}')"
  if [ -n "$NOAUT" ]; then
    echo "Hay un teléfono conectado sin autorizar: acepta «Permitir depuración USB» en su pantalla y vuelve a correr esto."
  fi
fi
if [ -n "$SERIE" ]; then
  prop() { "$ADB" -s "$SERIE" shell getprop "$1" | tr -d '\r'; }
  SDK="$(prop ro.build.version.sdk)"; VER="$(prop ro.build.version.release)"; ABIS="$(prop ro.product.cpu.abilist)"; MODELO="$(prop ro.product.model)"
  echo "Teléfono: $MODELO · Android $VER (API $SDK) · procesadores: $ABIS"
  if [ "${SDK:-0}" -lt 29 ]; then echo "Necesita Android 10 (API 29) o más nuevo. Este teléfono tiene Android $VER."; exit 1; fi
  case "$ABIS" in
    *arm64-v8a*) ;;
    *) echo "El procesador no es de 64 bits (arm64): este APK no se puede instalar aquí."; exit 1 ;;
  esac
  echo "Instalando $NOMBRE ($TAM)…"
  "$ADB" -s "$SERIE" install -r "$APK"
  "$ADB" -s "$SERIE" shell monkey -p pa.antifraude.movil -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true
  echo "Instalado y abierto. Primera prueba: pega un texto de fraude y toca «Verificar el texto»."
  exit 0
fi
if [ "$MODO" = usb ]; then
  echo "No hay teléfono por USB. En el teléfono: Opciones de desarrollador → Depuración USB, conectar el cable y aceptar el aviso."
  exit 1
fi

# 4. Por Wi-Fi: servir el APK desde esta máquina y mostrar un QR con la dirección.
IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || true)"
if [ -z "$IP" ]; then echo "No encuentro la dirección de esta máquina en la red. Conecta el Wi-Fi y vuelve a intentar."; exit 1; fi
PUERTO=8765
while lsof -iTCP:"$PUERTO" -sTCP:LISTEN >/dev/null 2>&1; do PUERTO=$((PUERTO + 1)); done
URL="http://$IP:$PUERTO/$NOMBRE"
echo
echo "Sin teléfono por USB. El APK ($TAM) queda servido en esta red Wi-Fi:"
echo
echo "    $URL"
echo
if command -v qrencode >/dev/null 2>&1; then
  qrencode -t ANSIUTF8 -m 1 "$URL"
else
  echo "(con «brew install qrencode» aparece aquí el código QR; mientras tanto, escribe la dirección en el teléfono)"
fi
echo
echo "En el teléfono, conectado a la misma red Wi-Fi: escanea el QR o escribe la dirección, baja el archivo, ábrelo y permite la"
echo "instalación desde el navegador. Si Play Protect avisa, «Instalar de todos modos». Ctrl+C aquí apaga el servidor."
cd "$(dirname "$APK")"
exec python3 -m http.server "$PUERTO" --bind 0.0.0.0
