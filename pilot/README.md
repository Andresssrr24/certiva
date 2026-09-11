# Certiva · piloto bancario v0.1

Implementación para evaluación interna de **verificar mensaje → confirmar reporte → revisar caso → resolver**. Caja de Ahorros es una referencia de configuración pública, pendiente de aprobación institucional. No hay conexión al banco, acceso a cuentas, retención de pagos ni USDT.

## Entregables

| Pieza | Implementado | Límite actual |
|---|---|---|
| SDK de reglas compartido | JavaScript puro; resultado explicable; reporte de datos mínimos | Heurísticas de texto; no autentica remitentes ni acredita eficacia contra fraude real |
| Android | SDK AAR y app 0.2; entrada de texto y alertas locales voluntarias de WhatsApp | Android 13+; reglas locales, sin OCR ni QVAC. [Guía de alertas](../docs/ALERTAS-ANDROID.md). |
| iOS | Swift Package, JavaScriptCore, verificación de firma y OCR Apple Vision | iOS 16+; comprobado en simulador y SDK sobre Mac, pendiente de teléfonos físicos |
| Consola y cliente web | Login, roles, reporte, bandeja, asignación, resolución y auditoría | Local, 200 casos recientes por consulta; sin SSO, roles de configuración ni expediente con contenido |
| Backend | SQLite, sesiones de una hora, CSRF, tenant derivado de sesión, idempotencia y control de concurrencia | Un proceso local; registro auditable pero no inmutable; no despliegue de producción |

El análisis en estas apps usa reglas locales. iOS extrae texto de capturas con Apple Vision y pide que el usuario confirme la lectura. El motor QVAC de Electron permanece independiente y no se invoca desde este piloto. No se presentan estos resultados como inferencia QVAC móvil.

## Probar la consola

Desde esta carpeta, con Node 22.17+ (SQLite nativo; en Node 22 aparece un aviso experimental):

```sh
node server.js
```

Abrir `http://127.0.0.1:4320`. No hacen falta `npm install`, servicios externos ni modelos descargados. El puerto 4318 pertenece al puente QVAC de la landing.

Al primer arranque se crean accesos aleatorios para `cliente`, `analista` y `auditor`, en un archivo privado cuya ruta imprime el servidor. En este Mac: `~/Library/Application Support/CertivaPilot/accesos-locales.json`. No adjuntar ese archivo a demos, repositorios ni correos. El usuario del sistema operativo que posee los archivos puede acceder a la base; no es aislamiento frente al administrador del Mac.

Los reportes se conservan en `cases.sqlite` en la misma carpeta. `CERTIVA_PILOT_DATA` permite elegir otro directorio privado; `CERTIVA_PILOT_PORT` cambia el puerto de la consola, pero las apps de ejemplo esperan 4320.

1. Entrar como cliente y pulsar «Probar una suplantación».
2. Verificar el mensaje y revisar qué datos se enviarán.
3. Confirmar voluntariamente el reporte. Anotar su identificador.
4. Cerrar sesión e ingresar como analista.
5. Abrir el caso, tomarlo y resolverlo. Las conclusiones son humanas; para una prueba sin evidencia original, usar «Sin evidencia suficiente».
6. Revisar Auditoría. El auditor puede leer pero no gestionar casos.
7. Volver como cliente y consultar el estado. El mensaje original no está en la base.

La app web conserva el texto únicamente durante la sesión de pantalla. El cierre de sesión limpia su estado. No pegar datos reales antes de acordar el tratamiento con el banco.

## Android: APK y AAR

La app 0.2 incorpora protección voluntaria de notificaciones. Las instrucciones y los límites están en [la guía de alertas](../docs/ALERTAS-ANDROID.md); su evidencia se documenta en [VALIDACION-ANDROID-0.2.md](VALIDACION-ANDROID-0.2.md). La validación 0.1 descrita más abajo se conserva como antecedente, no valida por sí sola las alertas 0.2.

Proyecto: `android-app/`. La biblioteca integrable está en `sdk/`; la app de ejemplo está en `app/`.

Requisitos de compilación: JDK 17, Android SDK plataforma 35, Gradle 9.1.0 y Android Gradle Plugin 9.0.1. El wrapper generado permite reproducir la compilación:

```sh
cd android-app
./gradlew :app:assembleDebug :sdk:assembleRelease
```

Configurar `JAVA_HOME` y `ANDROID_HOME` según la instalación. En este Mac:

- JDK: `/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home`
- Android SDK: `/opt/homebrew/share/android-commandlinetools`

Salidas: `app/build/outputs/apk/debug/app-debug.apk` y `sdk/build/outputs/aar/sdk-release.aar`. El APK es de depuración, no una publicación de Play Store. El AAR contiene el motor y configuración de desarrollo; no incorpora credenciales ni necesita permiso de internet.

Para conectar la app de muestra con la consola local desde un teléfono autorizado para depuración USB o emulador:

```sh
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb reverse tcp:4320 tcp:4320
```

La evaluación de texto no necesita conexión ni sesión. Reportar y consultar casos sí requieren el acceso de cliente y la conexión al servidor local. La excepción HTTP del ejemplo solo admite `127.0.0.1`; un banco debe sustituir el transporte de muestra por sus canales autenticados con TLS.

El SDK Android verifica Ed25519 con Bouncy Castle 1.85.2 incluido como dependencia Gradle, sin depender del proveedor criptográfico del fabricante. Si se integra el AAR como archivo, agregar también `org.bouncycastle:bcprov-jdk18on:1.85.2`; el AAR por sí solo no empaqueta esa dependencia. La compatibilidad inicial se mantiene en Android 13 por las APIs de la muestra y debe ampliarse con pruebas, no bajando `minSdk` sin validación.

Integración: crear `CertivaEngine` en el hilo principal, esperar su callback de inicialización y llamar `assess(text, channel, callback)`. `CertivaEngine.report(result, true)` proyecta el reporte mínimo después de que la interfaz obtenga confirmación. El banco decide cómo autenticar y enviar; `close()` libera el WebView interno. Ese WebView no carga redes, no accede a archivos y no expone puentes Java al contenido.

## iOS: paquete y app de muestra

Abrir `ios/CertivaPilot.xcodeproj`, elegir el esquema CertivaPilot y un simulador iPhone. El proyecto también puede regenerarse con XcodeGen desde `ios/project.yml`. Para un dispositivo físico hacen falta firma de desarrollo y transporte autorizado: `127.0.0.1` en un iPhone físico no representa al Mac.

El banco puede agregar `ios/` como Swift Package local e importar `CertivaSDK`:

```swift
let engine = try CertivaEngine() // MainActor
let result = try engine.assess(text: message, channel: "whatsapp")
// Solo después de mostrar la vista previa y obtener confirmación:
let payload = try result.reportPayload(consent: true)
```

Para una captura, `await CertivaEngine.readImage(data)` lee con Apple Vision fuera del hilo principal. El cliente revisa el texto y llama `assess` con `source: "apple_vision"` y `readingConfirmed: true`. Sin esa confirmación se devuelve un resultado no concluyente. El SDK no sube la imagen, guarda contraseñas ni envía reportes por su cuenta.

## Configuración y privacidad

- La configuración de referencia se firma durante el build con Ed25519. La clave pública va fijada en las aplicaciones; no se confía en una clave recibida del servidor.
- `node build.js` genera el bundle compartido y los recursos para web, iOS y Android. La clave privada de desarrollo queda en `.local/`, ignorada por Git. Reconstruir desde otro equipo puede cambiar la identidad de desarrollo; el banco debe controlar claves, revisión, distribución y rotación.
- La configuración vence el **10 de diciembre de 2026**. No se amplía automáticamente. El SDK se abstiene si está vencida. No hay aún actualización remota de políticas ni protección contra rollback entre versiones firmadas anteriores.
- Los canales de referencia no constituyen un directorio bancario aprobado. Reconocer un dominio no autentica remitentes.
- El reporte contiene nueve campos: identificador de evaluación, resultado, códigos de motivo, canal, lector, fecha, versión de política, versión de SDK y confirmación. No contiene texto, capturas, teléfonos, enlaces ni hashes de esos datos.
- El backend marca el origen como reporte de cliente no verificado. Firmar la configuración no vuelve confiable un cliente que puede estar manipulado.
- Cuenta y reporte siguen siendo datos vinculables a una persona. No se califican como anónimos.
- No hay intercambio P2P, analytics externos ni datos de muestra precargados automáticamente en la consola.

## Comprobaciones

```sh
node --test test/*.test.js
cd ios
swift test
```

Las pruebas Node cubren reglas, abstención, minimización, paridad de bundle, flujo de casos, deduplicación, conflictos de versión, separación de bancos y clientes, permisos, CSRF, origen/host, tamaño máximo, límites de reportes y persistencia. Las pruebas Swift incluyen lectura real de una captura sintética con Apple Vision y rechazo de una firma alterada. La captura viene del dataset de desarrollo: es una prueba de funcionamiento, no evaluación independiente.

Las pruebas instrumentadas están en `android-app/app/src/androidTest/`. Para reproducirlas, iniciar `node test/android-server.js` (backend aislado en memoria, puerto 4321), compilar `:app:assembleDebugAndroidTest` e instalar la app y el APK de pruebas. Seleccionar expresamente el dispositivo de pruebas:

```sh
adb -s <serial> reverse tcp:4321 tcp:4321
adb -s <serial> shell am instrument -w -e class local.certiva.pilot.EngineTest local.certiva.pilot.test/android.test.InstrumentationTestRunner
```

El test usa `http://127.0.0.1:4321`; la app de muestra sigue usando 4320. Al terminar, quitar solo el reverse de pruebas con `adb -s <serial> reverse --remove tcp:4321` y detener el fixture. La versión base pasó 2/2 pruebas: motor firmado y login/reporte/consulta. Fue necesario indicar la clase: el descubrimiento general del ejecutor legacy terminaba con «Process crashed». Si la instalación streaming se queda esperando, usar `adb install --no-streaming -r archivo.apk`. Ver [evidencia de la versión base](VALIDACION.md). Esta rama conserva la validación Node/Swift y de compilación propia; queda pendiente ejecutar su APK en el emulador.

## Antes de usuarios bancarios reales

Esta versión permite que un equipo del banco evalúe la integración técnica. Para un piloto con clientes hacen falta:

1. Directorio y política aprobados por el banco, evaluación independiente de detección y criterio de falsos positivos/abstenciones.
2. SSO/MFA del equipo, autorización de dispositivos/clientes desde la app bancaria, aprovisionamiento y revocación; reemplazar accesos locales de demostración.
3. TLS, despliegue institucional, base y backups protegidos, retención acordada, gestión de derechos, monitoreo y respuesta a incidentes. No exponer este servidor local a internet.
4. Pruebas en teléfonos físicos representativos, accesibilidad, consumo y revisión de seguridad del SDK y aplicaciones.
5. Operación de casos: quién corrobora, cómo solicita evidencia adicional y qué SLA puede sostener. Los nueve campos mínimos no bastan para confirmar todos los casos ni tramitar bajas de dominios.
6. Licencias y SBOM de entregables; firma de distribución de apps, cobertura Android y versión iOS acordadas. Los iconos definitivos de distribución y packaging de tiendas siguen pendientes.

Consultar `OFERTA-PILOTO.md` para el alcance comercial propuesto. La salida a clientes se decide con esos criterios, no por el solo hecho de que compile un APK.

## Integración con la rama del PR

La entrega integra las reglas del `main` de referencia `69d1f34`. Se regeneró el JavaScript compartido preservando la política firmada y su clave pública de desarrollo. Las señales `envio_para_recibir` y `cambio_direccion` tienen explicación, conservan el resultado de riesgo y son aceptadas por la API. Son tácticas de pago heredadas del motor; no incorporan USDT al alcance del producto.

Validación en la rama de integración: 15 pruebas Node y 6 Swift, incluidas las regresiones de paridad fuente/bundles y reporte a consola. La app iOS también compiló para simulador con Xcode desde esta rama. El OCR de Swift usa una captura sintética real; no mide eficacia en mensajes bancarios reales. Las pruebas nativas anteriores y los APK/AAR producidos en otra tarea deben distinguirse de los artefactos que se reconstruyan desde esta rama.

### Compilación Android de esta rama

`./gradlew :app:assembleDebug :app:assembleDebugAndroidTest :sdk:assembleRelease :app:lintDebug` terminó correctamente con JDK 17 y Android SDK 35. Se generaron APK de depuración, APK de pruebas y AAR; lint informa **0 errores y 13 advertencias**. El bundle conserva las correcciones probadas en las 15 pruebas Node. Esto verifica compilación, no instalación ni el recorrido de red de este APK; la prueba instrumentada completa sigue pendiente.
