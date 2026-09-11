# Componentes y atribuciones del piloto

- El SDK de texto incorpora `lib/reglas.js` del proyecto Certiva. Su bundle se genera con `build.js` y debe reconstruirse y probarse cuando cambien las reglas.
- Bouncy Castle `org.bouncycastle:bcprov-jdk18on:1.85.2`: verificación Ed25519 en Android con la API ligera, sin registrar ni sustituir proveedores globales. [Licencia y descarga del proveedor](https://www.bouncycastle.org/download/bouncy-castle-java/). El APK incorpora la dependencia; un AAR integrado como archivo necesita declararla también en Gradle.
- Manrope, peso 800, reutilizada desde el proyecto. Licencia SIL Open Font License en `public/Manrope-OFL.txt`.
- La referencia gráfica de Certiva se reutiliza desde `renderer/assets/certiva-brand.png`. La vista recorta la lámina en presentación; no constituye un nuevo master vectorial.
- Apple Vision, JavaScriptCore y CryptoKit son frameworks del sistema de Apple. El SDK iOS no incluye un modelo QVAC.
- Android SDK, WebView y bibliotecas de pruebas pertenecen a sus respectivas distribuciones. La app Android no carga páginas remotas en el motor local.
- Backend sin dependencias npm externas: módulos incluidos en Node.js y SQLite de esa distribución. El inventario debe completarse contra cada build de distribución y revisarse antes de un despliegue bancario.

La licencia Apache-2.0 del código del proyecto está en `LICENSE`; las licencias de terceros conservan sus condiciones. Esta lista no es una certificación regulatoria, criptográfica ni de seguridad del producto.
