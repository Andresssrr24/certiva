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
      // Sin R8: con minify el APK de release arranca y muere con «TurboModuleRegistry.getEnforcing: PlatformConstants could not
      // be found» (medido en el emulador arm64 API 35). El plugin de QVAC lo deja en true; aquí se apaga. Cuesta unos 5 MB.
      [
        "expo-build-properties",
        {
          android: {
            minSdkVersion: 29,
            enableMinifyInReleaseBuilds: false,
            enableShrinkResourcesInReleaseBuilds: false,
          },
        },
      ],
      // antes del plugin de QVAC: los mods de Expo corren del último registrado al primero, así este corrige lo que QVAC escribe
      "./plugins/opencl-opcional.js",
      "@qvac/sdk/expo-plugin",
    ],
  },
};
