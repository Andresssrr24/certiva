# Revisión de integración del registro beta

11 de septiembre de 2026. Integración aislada desde `main` (`6eee9ea`) del inventario congelado de la tarea de landing. Este corte se integró en `main` mediante la PR #35. Esta tarea publica código y documentación; la tarea propietaria realiza los despliegues y configura las variables autorizadas.

## Comportamiento integrado

El visitante confirma su cuenta de Google y acepta participar; el servidor utiliza únicamente el correo verificado y confirma la membresía del grupo antes de dar el registro por terminado. Se mantienen state, nonce, PKCE, cookies cifradas y validación exacta del destino Play.

`BETA_ENABLED` controla el registro y `BETA_PLAY_READY` la disponibilidad de instalación. Con registro confirmado y Play pendiente, la API devuelve el correo sin `playUrl`; la interfaz confirma el alta, conserva el aviso de descarga pendiente y no muestra el enlace de instalación. Si el registro está apagado, la API no devuelve correo ni URL aunque la cookie indique un alta previa. Las banderas no sustituyen la validación de Google Play.

El enlace empieza oculto y sin `href`; recibe una URL validada antes de mostrarse. La excepción puntual de Biome documenta ese estado transitorio. El botón de Google se restablece en `pageshow` para permitir volver a intentarlo tras regresar desde OAuth. El consentimiento, los scopes y la política de privacidad del registro no cambian.

El QR recupera la ruta estable `/apk` y su redirect lleva a `/probar`, igual que el botón. Sustituye el destino Expo de PR #33 en esta tarjeta nativa; la app Expo permanece disponible en su Release. Se conserva el teléfono interactivo de la landing.

## Validación

- `npm test`: **20/20 PASS**, después del formato de integración. Incluye diez pruebas de backend beta, tres de estados de interfaz y siete de reglas/puente. OAuth, membresía y render de interfaz están controlados con dobles explícitos; no se realizan altas reales desde esta suite.
- Se comprueban registro confirmado sin enlace de descarga, bandera lista con URL exacta, destino inválido, visitantes nuevos mientras Play está pendiente y apagado sin correo/URL. Se mantienen las comprobaciones de identidad, consentimiento, cookies alteradas/caducadas y membresía exacta.
- `npm run build`: **PASS**, con tamaño y SHA-256 del APK histórico 0.3 requeridos por el build. Después se retiraron solo la copia de APK y `dist/` de esta revisión para no duplicar espacio. Los originales se conservan.
- Biome de los cinco archivos de código/HTML/pruebas de este corte: sin errores. El aviso previo de `[hidden] !important` en CSS no cambia.
- IDs de HTML únicos y referencias JavaScript válidas; enlace Play inicialmente oculto y sin `href`.
- QR decodificado previamente como `https://certiva-landing.vercel.app/apk`, SHA-256 del SVG `3ab5614ebd69acd6ca1237bcee8236f261fc67b46b52beab3466af2dc1f95565`; no cambió en este corte.
- `git diff --check`: correcto.

## Producción y alcance

La tarea propietaria confirmó el despliegue READY `dpl_98DyQHhxBznSeP635h4mALX3aP1y`, con ocho variables sensibles y autorización de Bryan para probar el registro. GET público independiente de `/api/beta/status`: HTTP 200, `enabled:true`, `playReady:false`, `registered:false`. La tarea propietaria verificó el formulario visible y el aviso de descarga pendiente en la web. La tarea propietaria completó OAuth en Chrome de escritorio con una cuenta que ya pertenecía al grupo. Bryan confirmó posteriormente que el registro funciona en Android. La nueva alta externa instrumentada e instalación desde Play siguen pendientes.

Las comprobaciones reales previas de consulta/alta autorizada del grupo están recogidas en [BETA-SETUP.md](BETA-SETUP.md). Esta revisión no repite operaciones de membresía, consulta secretos ni publica correos de verificadores. `npm run dev` solo ofrece una vista estática y no emula las funciones de Vercel.

## Privacidad Android y ficha de Play

La política `/privacidad-app` se comparó byte a byte con el archivo publicado durante su integración. Rewrite y recursos locales correctos; `play-store-assets/` queda excluido de Vercel. Icono 512×512, gráfico 1024×500 inspeccionado y capturas 1080×2400. Las capturas son idénticas a `menu-home.png` y `menu-verify.png` de la evidencia nativa 0.4 target35, no a una instalación Play.

Actualización posterior comunicada por la tarea propietaria: acceso de revisión, IARC, público mayores de 18 años, Seguridad de datos e ID de publicidad «No» guardados; ficha lista tras la intervención de Bryan. El borrador Alpha conserva únicamente el AAB versión 5 y se enviaron 14 cambios de **0.5.0 · Certiva · Prueba cerrada**. Console muestra «Cambios en la etapa de revisión», sin aprobación ni disponibilidad cerrada confirmadas. La publicación administrada está desactivada; Panamá y el grupo no cambiaron. `BETA_PLAY_READY=false` mantiene pendiente la descarga. Los materiales 0.4 anteriores son históricos; esta actualización documental no repite las comprobaciones de Console ni modifica Android.

## Corrección del envío del formulario

Bryan observó `error: origin` en Android antes de llegar a Google. El POST nativo estaba afectado por la política global `no-referrer`, que puede convertir su cabecera Origin en `null`, como recoge el [algoritmo de Fetch](https://fetch.spec.whatwg.org/#append-a-request-origin-header). La página declara ahora `same-origin` mediante un meta temprano; el backend mantiene el origen exacto requerido y las respuestas OAuth mantienen `no-referrer`.

Las pruebas ampliadas rechazan origen nulo, ausente, externo y dominio parecido con HTTP 403 sin emitir cookie; el envío con origen exacto y consentimiento sigue permitido. Suite completa de integración: 19/19 PASS, Biome de los dos archivos modificados sin errores. Se confirmó el meta en la página publicada y la cabecera HTTP global sin cambios. No se repitió el build aislado de este cambio de meta; la tarea propietaria informó build correcto.

La prueba de Android falló antes del arreglo. La prueba completa posterior se hizo en Chrome de escritorio con el propietario ya miembro del grupo, conservando descarga pendiente y sin enlace de instalación. No se publican su correo, cookies, códigos ni tokens de OAuth.

Confirmación posterior comunicada por la tarea propietaria: Bryan probó el arreglo y dio por listo el registro Android. Se registra como confirmación del usuario; esta tarea no obtuvo una traza OAuth de ese dispositivo. La disponibilidad de descarga continúa pendiente.

## Redirección a Play preparada

El callback usa HTTP 303 al destino Play exacto únicamente después de verificar la identidad, confirmar la membresía y comprobar `BETA_PLAY_READY=true`. El destino no contiene correo ni tokens y la respuesta mantiene `no-referrer`. Con la bandera apagada vuelve a la confirmación; si falla el alta vuelve al error, incluso con Play listo.

Suite completa tras integrar este corte: 20/20 PASS. La prueba añadida confirma redirección, destino exacto, cabecera de privacidad y cookies; la prueba de fallo de membresía se ejecuta también con la bandera activa. Biome de backend/pruebas sin errores. La tarea propietaria informó build correcto; no se reconstruyó el sitio estático para este cambio exclusivo del callback. GET público independiente mantiene `enabled:true`, `playReady:false`, `registered:false`. No se activó descarga desde esta tarea ni se publicó el canal cerrado.
