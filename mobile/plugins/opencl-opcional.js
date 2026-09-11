// Plugin de Expo: deja libOpenCL.so declarada como biblioteca nativa OPCIONAL en el AndroidManifest.
// El plugin de QVAC la declara sin android:required, que Android toma como obligatoria, y entonces el APK no instala
// en dispositivos sin OpenCL (emuladores y teléfonos con GPU Mali, como los Pixel): INSTALL_FAILED_MISSING_SHARED_LIBRARY.
// El motor carga los backends de ggml dinámicamente y sin OpenCL usa Vulkan o CPU, así que la biblioteca puede faltar.
const { withAndroidManifest } = require("expo/config-plugins");

module.exports = function openclOpcional(config) {
  return withAndroidManifest(config, (c) => {
    const app = c.modResults.manifest.application?.[0];
    if (!app) return c;
    const libs = app["uses-native-library"] || [];
    const opencl = libs.find((l) => l.$?.["android:name"] === "libOpenCL.so");
    if (opencl) opencl.$["android:required"] = "false";
    else libs.push({ $: { "android:name": "libOpenCL.so", "android:required": "false" } });
    app["uses-native-library"] = libs;
    return c;
  });
};
