# Certiva Android 0.5 · Reportes por HTTPS

La versión `0.5.0-reportes-piloto` (versionCode5) conecta Ingresar y Mis reportes al servicio público `https://certiva-landing.vercel.app/api/reports/`. El alta de reportes requiere una cuenta asignada, independiente del registro Google para descargar la app. No contiene credenciales. La versión0.4 conserva el transporte local.

## Cambios

- Destino HTTPS exacto y rutas permitidas, sin seguir redirecciones; límites de conexión/lectura y respuesta acotada.
- Release no permite tráfico HTTP. Solo la variante debug permite los endpoints locales4320/4321 para las pruebas existentes.
- Confirmación de datos enviados y vínculo con la cuenta antes de reportar. No envía mensaje original, remitente, enlaces, números ni imágenes.
- Mis reportes incorpora borrado con una segunda confirmación. Cerrar sesión elimina cookie y token CSRF de memoria.
- Conserva API36 y la navegación Atrás de su base. No cambia el runtime QVAC ni sus modelos.

## Validación de la fuente

La tarea propietaria ejecutó `PublicReportsTest`: **2/2 PASS,6.242s**, emulador Android15/API35, variante debug con target36. El SDK local firmado generó el reporte mínimo; PilotAPI completó login → reporte → duplicado → logout/login → persistencia → borrado → logout contra HTTPS real, sin localhost ni adb reverse.

Lint release: **0 errores,20 avisos**. AAB firmado: **41.967.268 bytes**, SHA-256 `c9753707642fa6455e2bf5d7b7e06aade79491994ae70e047f300183a37a69d4`. Se verificaron tamaño y hash sin copiar el AAB a Git. [Evidencia](../evidencias/android-reportes-20260911/android-https.txt) · [Metadatos](../evidencias/android-reportes-20260911/artifact.json) · [Hashes de las seis fuentes incorporadas](../evidencias/android-reportes-20260911/source-sha256.json).

La integración conserva las pruebas históricas de la base publicada. Tres pruebas anteriores en la copia de build eran revisiones más antiguas; no se copiaron sobre las correcciones de main. Esto no afecta los seis archivos inventariados ni las dos pruebas HTTPS reportadas. No se reejecutó la suite Android completa ni se reconstruyó el binario durante esta publicación.

## Distribución y límites

La tarea propietaria comprobó version5 publicada en la prueba interna el11de septiembre de2026 a las07:19 de Panamá, disponible para los testers de ese canal. El canal cerrado sigue pendiente. No se ha verificado instalación física desde Play, Android16, recepción real de WhatsApp ni inferencia QVAC en esta corrida.

[Instrucciones para revisores, sin credenciales](ACCESO-REVISION-PLAY.md). La contraseña dedicada se entrega por separado solo con autorización expresa; no forma parte de la APK, documentos públicos ni evidencias. El servicio es un piloto técnico, no una conexión al banco ni un canal de denuncias.

El servicio backend se entrega en [PR #38](https://github.com/Andresssrr24/certiva/pull/38), que también actualiza el README e inventario general. Esta PR mantiene las fuentes y evidencias Android separadas de ese backend.
