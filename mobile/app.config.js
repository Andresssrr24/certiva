// Configuración Expo de la app móvil. Los plugins vienen del tutorial oficial de QVAC para Expo.
// Marca (MEMORIA_PROYECTO.md y docs/ICONO-ANDROID.md): nombre «Certiva» e icono adaptativo con el símbolo Enlace sobre
// fondo blanco, derivado del mismo PNG que usa pilot/android-app (PR #13). El paquete Android no cambia para que el
// APK nuevo actualice al anterior y para que instalar.sh siga abriéndolo.
module.exports = {
  expo: {
    name: "Certiva",
    slug: "antifraude-movil",
    version: "0.2.0",
    orientation: "portrait",
    icon: "./assets/icono.png",
    platforms: ["android", "ios"],
    android: {
      package: "pa.antifraude.movil",
      permissions: [],
      // El símbolo ocupa el 66 % central del lienzo: la zona segura de las máscaras del sistema (equivale al margen
      // de 18 dp del icono nativo del piloto).
      adaptiveIcon: { foregroundImage: "./assets/icono-adaptativo.png", backgroundColor: "#FFFFFF" },
    },
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
      "./plugins/precarga-appmodules.js",
      "@qvac/sdk/expo-plugin",
    ],
  },
};
