// Plugin de Expo: carga libappmodules.so con el enlazador del sistema antes de que React Native lo pida a SoLoader.
// libappmodules.so enlaza libbare-kit.so, y esa necesita libnativehelper.so, una biblioteca pública del sistema que
// desde Android 10 vive en el APEX de ART. SoLoader solo busca en /system/lib64 y /vendor/lib64, no la encuentra,
// descarta appmodules y la app muere al arrancar con «TurboModuleRegistry.getEnforcing: PlatformConstants could not
// be found» (medido en el emulador arm64 API 35). System.loadLibrary resuelve la dependencia sin problema.
const { withMainApplication } = require("expo/config-plugins");

const MARCA = "loadReactNative(this)";
const PRECARGA = `// libappmodules.so -> libbare-kit.so -> libnativehelper.so (APEX de ART): SoLoader no la encuentra, el sistema sí.
    try {
      System.loadLibrary("appmodules")
    } catch (e: UnsatisfiedLinkError) {
      android.util.Log.w("antifraude", "appmodules: " + e.message)
    }
    ${MARCA}`;

module.exports = function precargaAppmodules(config) {
  return withMainApplication(config, (c) => {
    const s = c.modResults.contents;
    if (!s.includes('System.loadLibrary("appmodules")')) {
      if (!s.includes(MARCA))
        throw new Error("precarga-appmodules: no encuentro loadReactNative(this) en MainApplication");
      c.modResults.contents = s.replace(MARCA, PRECARGA);
    }
    return c;
  });
};
