// Configuración Expo de la app móvil. Los plugins vienen del tutorial oficial de QVAC para Expo.
module.exports = {
  expo: {
    name: "Anti-fraude",
    slug: "antifraude-movil",
    version: "0.1.0",
    orientation: "portrait",
    platforms: ["android", "ios"],
    android: { package: "pa.antifraude.movil", permissions: [] },
    plugins: [
      ["expo-build-properties", { android: { minSdkVersion: 29 } }],
      // antes del plugin de QVAC: los mods de Expo corren del último registrado al primero, así este corrige lo que QVAC escribe
      "./plugins/opencl-opcional.js",
      "@qvac/sdk/expo-plugin",
    ],
  },
};
