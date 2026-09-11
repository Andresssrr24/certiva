# Recuperación del piloto local compatible con Android0.4

El 11 de septiembre de 2026, la nueva grabación Android detectó que el servicio local rechazaba con HTTP400 motivos emitidos por la APK0.4: `envio_para_recibir` y `cambio_direccion`. El servicio se había iniciado desde una copia antigua, mientras el APK usaba el SDK ya integrado en Git. No se amplió el contrato ni se desactivaron validaciones para aceptar el reporte.

Se recuperó el servicio desde el commit publicado `5216166`, cuyo servidor admite esos códigos y valida sus resultados. Antes de arrancarlo, el proceso anterior ya no existía y el puerto4320 no tenía listener. Las tareas de grabación confirmaron que no había envíos activos.

## Resultado de la recuperación

- Las 16 pruebas del piloto pasaron, incluidas aceptación de los motivos vigentes, rechazo de campos extra, consentimiento, roles, CSRF, aislamiento e idempotencia. Usan bases temporales; no enviaron reportes al servicio de la grabación.
- Se conservó el directorio existente de datos mediante `CERTIVA_PILOT_DATA`, con su base y archivo de usuarios. Se hizo un respaldo local privado antes del arranque; no se adjunta al repositorio.
- La comparación antes/después confirmó idéntico contenido de usuarios (3), casos (2), auditoría (37) y sesiones (7), además del archivo de accesos. Son conteos de ese instante, no un contador vivo.
- El servicio respondió200 en `/`, `/certiva.js` y `/policy.json`; los archivos servidos coinciden con el commit.
- `certiva.js`, `policy.json` y `policy-key.txt` extraídos del APK0.4 coinciden byte por byte con los recursos del SDK del servidor. APK SHA-256: `8ee2f1d708149db3043e2de50b40df441116bf67244ed8ea654b0a63486b468f`.

[Resultado comprobado](evidencias/piloto-compatible-20260911.json). La recuperación no creó casos ni alteró reportes. La tarea Android puede ahora repetir su captura con el servidor compatible. Esto todavía no prueba que esa nueva toma o envío hayan terminado correctamente.

## Repetir sin perder estado

Coordinar primero con las tareas que usan el puerto y detener los envíos. Usar una copia de una revisión publicada compatible con el APK; comprobar los assets y ejecutar `npm --prefix pilot test`. Confirmar que existen `cases.sqlite` y `accesos-locales.json` en el directorio de datos antes de iniciar el servicio: no crear una base o usuarios nuevos para resolver la discrepancia.

Desde esa copia, configurar `CERTIVA_PILOT_DATA` con el directorio existente y `CERTIVA_PILOT_PORT=4320`, y ejecutar `node pilot/server.js`. Verificar después el contenido conservado y la versión de los archivos servidos. No reiniciar a ciegas si el puerto está ocupado.

No es necesario regenerar la política para esta recuperación. Ejecutar `pilot/build.js` con otra clave de desarrollo podría producir recursos que no coincidan con la clave fijada en la APK. Las credenciales, la base, sus respaldos y el material de firma permanecen fuera de Git.

La actualización del servicio resuelve la incompatibilidad del contrato. El posible falso positivo de `envio_para_recibir` para solicitudes de códigos se investiga por separado; no se modificaron reglas ni se reconstruyó la APK durante esta recuperación.
