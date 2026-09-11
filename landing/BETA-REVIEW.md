# Revisión de integración del registro beta

11 de septiembre de 2026. Integración aislada desde `main` (`6eee9ea`) del inventario congelado de la tarea de landing. La PR permanece en borrador. Esta tarea publica código y documentación; la tarea propietaria realiza los despliegues y configura las variables autorizadas.

## Comportamiento integrado

El visitante confirma su cuenta de Google y acepta participar; el servidor utiliza únicamente el correo verificado y confirma la membresía del grupo antes de dar el registro por terminado. Se mantienen state, nonce, PKCE, cookies cifradas y validación exacta del destino Play.

`BETA_ENABLED` controla el registro y `BETA_PLAY_READY` la disponibilidad de instalación. Con registro confirmado y Play pendiente, la API devuelve el correo sin `playUrl`; la interfaz confirma el alta, conserva el aviso de descarga pendiente y no muestra el enlace de instalación. Si el registro está apagado, la API no devuelve correo ni URL aunque la cookie indique un alta previa. Las banderas no sustituyen la validación de Google Play.

El enlace empieza oculto y sin `href`; recibe una URL validada antes de mostrarse. La excepción puntual de Biome documenta ese estado transitorio. El botón de Google se restablece en `pageshow` para permitir volver a intentarlo tras regresar desde OAuth. El consentimiento, los scopes y la política de privacidad del registro no cambian.

El QR recupera la ruta estable `/apk` y su redirect lleva a `/probar`, igual que el botón. Sustituye el destino Expo de PR #33 en esta tarjeta nativa; la app Expo permanece disponible en su Release. Se conserva el teléfono interactivo de la landing.

## Validación

- `npm test`: **19/19 PASS**, después del formato de integración. Incluye nueve pruebas de backend beta, tres de estados de interfaz y siete de reglas/puente. OAuth, membresía y render de interfaz están controlados con dobles explícitos; no se realizan altas reales desde esta suite.
- Se comprueban registro confirmado sin enlace de descarga, bandera lista con URL exacta, destino inválido, visitantes nuevos mientras Play está pendiente y apagado sin correo/URL. Se mantienen las comprobaciones de identidad, consentimiento, cookies alteradas/caducadas y membresía exacta.
- `npm run build`: **PASS**, con tamaño y SHA-256 del APK histórico 0.3 requeridos por el build. Después se retiraron solo la copia de APK y `dist/` de esta revisión para no duplicar espacio. Los originales se conservan.
- Biome de los cinco archivos de código/HTML/pruebas de este corte: sin errores. El aviso previo de `[hidden] !important` en CSS no cambia.
- IDs de HTML únicos y referencias JavaScript válidas; enlace Play inicialmente oculto y sin `href`.
- QR decodificado previamente como `https://certiva-landing.vercel.app/apk`, SHA-256 del SVG `3ab5614ebd69acd6ca1237bcee8236f261fc67b46b52beab3466af2dc1f95565`; no cambió en este corte.
- `git diff --check`: correcto.

## Producción y alcance

La tarea propietaria confirmó el despliegue READY `dpl_7BiYWCnNmGCkYotp7k7tBWewbjaa`, con ocho variables sensibles y autorización de Bryan para probar el registro. GET público independiente de `/api/beta/status`: HTTP 200, `enabled:true`, `playReady:false`, `registered:false`. La tarea propietaria verificó el formulario visible y el aviso de descarga pendiente en la web. Esto no acredita OAuth completo desde Android ni una instalación desde Play; esas pruebas siguen pendientes.

Las comprobaciones reales previas de consulta/alta autorizada del grupo están recogidas en [BETA-SETUP.md](BETA-SETUP.md). Esta revisión no repite operaciones de membresía, consulta secretos ni publica correos de verificadores. `npm run dev` solo ofrece una vista estática y no emula las funciones de Vercel.

## Privacidad Android y ficha de Play

La política `/privacidad-app` se comparó byte a byte con el archivo publicado durante su integración. Rewrite y recursos locales correctos; `play-store-assets/` queda excluido de Vercel. Icono 512×512, gráfico 1024×500 inspeccionado y capturas 1080×2400. Las capturas son idénticas a `menu-home.png` y `menu-verify.png` de la evidencia nativa 0.4 target35, no a una instalación Play.

Play lleva 6 de 11 tareas completas según la tarea propietaria. Siguen pendientes acceso completo para revisores, clasificación IARC, declaración de recursos de IA y cierre de Seguridad de datos. La ficha no se ha enviado a revisión ni está publicado el canal cerrado. Archivar los materiales no resuelve las aprobaciones pendientes ni certifica cumplimiento. El código Android no cambia.
