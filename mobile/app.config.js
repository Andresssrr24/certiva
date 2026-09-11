// Configuración Expo de la app móvil. Los plugins vienen del tutorial oficial de QVAC para Expo.
module.exports = {
  expo: {
    name: "Anti-fraude",
    slug: "antifraude-movil",
    version: "0.1.0",
    orientation: "portrait",
    platforms: ["android", "ios"],
    android: { package: "pa.antifraude.movil", permissions: [] },
    plugins: [["expo-build-properties", { android: { minSdkVersion: 29 } }], "@qvac/sdk/expo-plugin"],
  },
};
