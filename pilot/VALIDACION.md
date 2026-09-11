# Validación de la versión base del piloto técnico 0.1.0

Fecha: 10 de septiembre de 2026. Datos sintéticos y cuentas locales de prueba. Esta validación corresponde al paquete congelado en `artifacts/v0.1.0/`; los desarrollos posteriores se validan por separado.

| Componente | Evidencia | Resultado |
|---|---|---|
| SDK/API Node | `node --test test/*.test.js` | 13 pruebas, 0 fallos |
| Swift Package | `swift test` | 5 pruebas, 0 fallos; incluye OCR Apple Vision de captura sintética |
| App iOS | Xcode, iPhone 17/iOS 26.5 Simulator | Compilación correcta; entrada y resultado comprobados en interfaz |
| Android | Gradle clean APK+APK tests+AAR+lint | Compilación correcta; lint 0 errores, 13 advertencias |
| Android nativo | Android 35, emulador arm64, clase EngineTest | 2 pruebas, 0 fallos: firma/análisis/reporte mínimo y login/envío/consulta contra servidor aislado 4321 |
| Consola web | Recorrido interactivo local | Cliente reporta, analista toma/resuelve, persistencia tras reinicio; sin errores de consola observados |

La prueba Android debe indicar la clase con `-e class local.certiva.pilot.EngineTest`. El descubrimiento general del ejecutor legacy terminó con «Process crashed» y numerosos mensajes de carga Dex; la ejecución dirigida completó ambas pruebas. Si la instalación streaming se queda esperando, usar `adb install --no-streaming -r archivo.apk`.

## Archivos congelados

- APK debug: `artifacts/v0.1.0/certiva-pilot-0.1.0-debug.apk`.
- AAR: `artifacts/v0.1.0/certiva-sdk-0.1.0.aar`; requiere Bouncy Castle como dependencia externa al AAR, detallada en README.
- SHA256SUMS y logs de pruebas junto a los archivos. Los artefactos generados están ignorados por Git.

## Límites de la evidencia

No se midieron reducción de fraude, precisión sobre un conjunto independiente ni rendimiento en teléfonos físicos. Android se validó mediante instrumentación; no se completó un recorrido visual Android en esta entrega. No hay OCR ni QVAC Android. La consola no está desplegada en infraestructura bancaria. La referencia a Caja de Ahorros no supone aprobación ni relación comercial. Las 13 advertencias lint incluyen actualización de target SDK, localización, iconos y reglas de extracción; deben revisarse antes de distribución institucional.

La app iOS compilada se verificó antes del último ajuste menor de filtrado de teléfonos sin directorio; el Swift Package con ese ajuste pasó sus cinco pruebas. Una distribución final requiere recompilar y repetir la aceptación de ambas apps con políticas aprobadas.

## Identificación de la versión base y resultado Android

La ejecución dirigida de `local.certiva.pilot.EngineTest` registró `OK (2 tests)` en 0,981 s. Comprueba firma/análisis/reporte mínimo y login/envío/consulta con el servidor de pruebas. Los archivos congelados se identifican por SHA-256:

```text
cdbc727dcacc41b2c92a6db3068035717e1ba020b34ada58f838575323a4c5a5  certiva-pilot-0.1.0-debug.apk
30e46377f111e7ea721f82bcc76e693f49089e363128d45fbbc032d42e42cea0  certiva-sdk-0.1.0.aar
```

## Diferencia con la rama integrada del PR #3

La tabla anterior corresponde a la versión base: **13 Node, 5 Swift y 2 Android**. La rama `codex/certiva-piloto` incorporó después las reglas del `main` actualizado y corrigió la correspondencia entre señales, bundles y reportes. En esa rama pasaron **15 pruebas Node y 6 Swift**, la app iOS compiló para simulador y se generaron APK, APK de pruebas y AAR con lint de 0 errores y 13 advertencias.

El APK generado desde la rama integrada **no se ha ejecutado todavía en el emulador**. Las dos pruebas de la versión base no deben presentarse como pruebas de ese APK. Queda pendiente repetir la instrumentación dirigida con sus binarios y su servidor, usando el comando de [README.md](README.md).
