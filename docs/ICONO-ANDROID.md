# Icono de Certiva para Android

El manifiesto de `pilot/android-app` declara `android:icon` y `android:roundIcon` con `@mipmap/ic_launcher`. El recurso adaptativo combina un fondo blanco con el símbolo Enlace de Certiva; el margen de 18 dp mantiene el contenedor cerámico dentro de la zona visible del lanzador.

El PNG está en `pilot/android-app/app/src/main/res/drawable-nodpi/certiva_launcher.png`. Deriva de la lámina aprobada `docs/marketing/brand/certiva-aplicaciones-azul-v5.png`, mediante la herramienta integrada ImageGen. Es una adaptación raster para la aplicación; la lámina v5 sigue siendo la referencia canónica de la marca.

## Instrucción de preparación

Extraer únicamente el icono grande de la firma superior izquierda: contenedor blanco de esquinas redondeadas y dos piezas curvas entrelazadas. Conservar orientación, abertura central, acabado cerámico y azul base #205094. Centrar en un lienzo cuadrado blanco, sin palabra, texto ni otros objetos, con márgenes iguales. No rediseñar ni simplificar el símbolo.

## Verificación

`./gradlew :app:processDebugResources --console=plain` pasó en la rama aislada del cambio: recursos y manifiesto Android compilados correctamente.

La instalación y revisión visual se realizan sobre la APK de desarrollo vigente en el emulador. Este cambio solo agrega recursos del lanzador y no modifica el motor de análisis ni sus resultados.
