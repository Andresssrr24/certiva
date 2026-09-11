# Demo Certiva: nueva interfaz Android y administración

Entregado el 11 de septiembre de 2026. Motion graphics nativos con grabaciones reales del APK y de la consola web del piloto. Sustituye los cortes visuales anteriores como demo funcional. No usa pantallas inventadas ni resultados inyectados.

- [Video final — 56 segundos, 1080p](https://d2ol7oe51mr4n9.cloudfront.net/user_3GMObER4e0Coaiy1mp7s18g2XJP/b94ea461-74c3-4de5-a0cc-3f6dbb2d9337.mp4)
- [Proyecto editable completo, fuentes y evidencia](https://d2ol7oe51mr4n9.cloudfront.net/user_3GMObER4e0Coaiy1mp7s18g2XJP/755c9705-f513-4559-be4b-3d80394a3211.zip)
- [Revisión visual final](https://d2ol7oe51mr4n9.cloudfront.net/user_3GMObER4e0Coaiy1mp7s18g2XJP/0934fe1e-abf0-4f61-97a1-02b17cfa0bf7.png)

## Recorrido

1. Firma original y campaña «Antes de responder, verifica».
2. Nueva portada del APK: entrada del mensaje, análisis real por reglas locales, motivos, consentimiento y recibo del servidor.
3. Continuidad del caso `8e8c15e5-8026-42de-8e51-44f2fa278697`, con assessment `880ee912-881b-4190-a541-d60ea595c2fc`.
4. Consola real: recepción, apertura, asignación al analista, selección de «Sin evidencia suficiente», resolución y auditoría.
5. Cierre con el logo aprobado y la identificación del piloto.

## Fuentes y comprobaciones

- APK instalado y fuente: SHA-256 `21542a5afe71591a1327fb39878e8044adaf77dd7aaaec27d347465de7dec942`.
- Móvil: `pilot/artifacts/real-home-demo-20260911-05/android-real-flow.mp4`, 20.0315 s, 540×1200, SHA-256 `76269a81a7388f922672d03bbb87a0f001edc6ee9d4ee0b0605917746f9b8f63`. RealHomeDemoTest pasó, consentimiento y envío reales; mismo assessment confirmado por servidor.
- Administración: `pilot/artifacts/real-admin-demo-20260911/admin-real-flow.mp4`, 83.6999 s, 1280×576, SHA-256 `a9e8a3c4262e787b614b36a14ef701dfe74d9731d68765903fd9da1e4b919254`. Se recuperó el archivo original después de que el grabador terminara de cerrarlo; no se reparó ni regeneró su contenido.
- **AdminDemoTest no pasó:** agotó el tiempo en la última lectura de JavaScript, después de ejecutar las seis fases visibles. Se conserva el fallo. La comprobación independiente, en conexión SQLite de solo lectura, confirmó mismo assessment, estado resuelto, analista, conclusión y eventos ordenados `reporte_recibido`, `caso_asignado`, `caso_resuelto`. No se reinició ni alteró el caso para repetir la toma.
- Evidencia: `qa/provenance.json`, `qa/admin-server-evidence.json` y los resultados originales incluidos en el ZIP. QA de 5 momentos móviles y 12 administrativos; hoja final revisada visualmente. Decodificación completa del MP4 final sin errores.

## Edición y límites

El render final es H.264, 1920×1080, 24 fps, 56.042 s, sin audio. SHA-256 `ded276b0d21b6c1402e83ee282b016cd1adff6da898ff487eceed9905a8235c7`.

Higgsedit usa el logo raster aprobado, sin redibujar símbolo ni wordmark. Se preserva completa la toma móvil. La administración conserva las ventanas originales 0–3 s, 14–31 s y 43–49 s, en orden, recortando esperas y barras del sistema Android. No se interpolaron acciones ni se cambiaron estados de interfaz.

Es una demostración en emulador con un mensaje sintético y análisis por reglas de texto. No acredita inferencia QVAC Android, un mensaje real de WhatsApp entre teléfonos, funcionamiento en teléfono físico ni integración bancaria. La consola web real se capturó en un WebView de prueba con viewport de escritorio.

Código de montaje: `demo-usuario-admin.js`. El proyecto editable contiene los medios, las tres fuentes Manrope y el proyecto nativo, además de instrucciones de reconstrucción.

## Archivo en GitHub y revisión de fuentes

El MP4 y el ZIP definitivo también quedan en la [release de avances](https://github.com/Andresssrr24/certiva/releases/tag/avances-2026-09-11) como `certiva-demo-final-20260911.mp4` y `certiva-demo-editable-20260911.zip`, con checksum separado. El ZIP tiene SHA-256 `78fd33e7b2d790b48b708990f465c006d99a65bc86e3834f0f02fc905cb9cbde`. La comprobación de publicación validó hashes, integridad del ZIP, correspondencia de medios/caso, igualdad del código de montaje y metadatos ffprobe. No se repitió el render ni la instrumentación.

`qa/AdminDemoTest.java` es una variante con logs añadidos después de la ejecución, conservada para pruebas futuras. No representa una nueva prueba aprobada. El código ejecutado y su fallo se conservan en el PR #25, junto con las grabaciones originales.
