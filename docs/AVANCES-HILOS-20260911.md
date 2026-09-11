# Avances reunidos de las tareas de Certiva

Corte actualizado: 11 de septiembre de 2026. El código y las evidencias se integran en ramas aisladas; el checkout compartido conserva sus archivos. Se distingue lo integrado en `main`, lo publicado en una PR y lo que sigue en preparación.

## Estado de las publicaciones

GitHub marca las PR #1 a #33 como fusionadas, pero ese estado no garantiza que todas entraran en `main`. La [PR #31](https://github.com/Andresssrr24/certiva/pull/31) se fusionó en la rama del menú después de que esta entrara en `main`: API36 quedó fuera. La [PR #36](https://github.com/Andresssrr24/certiva/pull/36) propone incorporar esos dos commits existentes directamente a `main`.

También quedan abiertas [PR #34](https://github.com/Andresssrr24/certiva/pull/34), evidencia de notificación/menú, y [PR #35](https://github.com/Andresssrr24/certiva/pull/35), registro Google y preparación de Play, esta última en borrador. Ambas estaban sin conflictos y con controles GitGuardian correctos en el corte consultado anterior a la actualización documental. Eso no equivale a ejecutar pruebas funcionales ni a aprobar Google Play.

| Tarea | Resultado publicado | Estado y alcance |
|---|---|---|
| Añadir alertas push para fraudes | Iconos [PR #13](https://github.com/Andresssrr24/certiva/pull/13)/[PR #15](https://github.com/Andresssrr24/certiva/pull/15), Android experimental [PR #18](https://github.com/Andresssrr24/certiva/pull/18), flujo real [PR #25](https://github.com/Andresssrr24/certiva/pull/25), nuevo caso [PR #34](https://github.com/Andresssrr24/certiva/pull/34) | La nueva demo recorre listener con notificación sintética, alerta, detalle, menú y reporte; el caso fue resuelto y revisado en consola. Se conservan los intentos fallidos y los límites de cada grabación. No demuestra recepción física de WhatsApp ni inferencia QVAC. |
| Probar esto en Android | Runtime, instalador, diagnóstico y evidencias [PR #18](https://github.com/Andresssrr24/certiva/pull/18) | Dos timeouts del clasificador corregido. Android QVAC sigue experimental; no se convierten esos fallos en pruebas aprobadas por publicar una APK. |
| Mejorar interfaz y menú | Inicio [PR #21](https://github.com/Andresssrr24/certiva/pull/21), menú 0.4 [PR #30](https://github.com/Andresssrr24/certiva/pull/30), API36/Atrás [PR #36](https://github.com/Andresssrr24/certiva/pull/36) | Seis pruebas de menú y una con texto al 130 % aprobadas. Dos pruebas de navegación API36 ejecutadas en emulador API35; no acreditan Android16 ni instalación física desde Play. |
| Diseñar producto para banca y USDT | Piloto bancario y propuesta integrados; portal [PR #17](https://github.com/Andresssrr24/certiva/pull/17), recuperación compatible [PR #32](https://github.com/Andresssrr24/certiva/pull/32) | Contrato validado con 16 pruebas y SDK/política cotejados con APK0.4. USDT queda fuera del alcance vigente; las condiciones comerciales son hipótesis. |
| Review decentralized AI hackathon | Contactos bancarios, fuentes y orientación [PR #17](https://github.com/Andresssrr24/certiva/pull/17) | Investigación histórica con fecha; una coincidencia de contacto no autentica al remitente ni implica aval bancario. |
| Crear landing Certiva interactiva | Guía y QR [PR #22](https://github.com/Andresssrr24/certiva/pull/22), teléfono interactivo [PR #24](https://github.com/Andresssrr24/certiva/pull/24), registro y privacidad [PR #35](https://github.com/Andresssrr24/certiva/pull/35) | Registro Google habilitado, descarga cerrada pendiente; callback a Play preparado detrás de su bandera. Suite de 20 pruebas aprobada. OAuth Chrome con miembro existente comprobado por la tarea y Android confirmado por Bryan. El servicio público de reportes/Android0.5 tiene trabajo posterior aún sin congelar. |
| Crear video motion graphics | [Demo final de 56 segundos y editable](marketing/video/ENTREGA-DEMO-FINAL.md), [PR #27](https://github.com/Andresssrr24/certiva/pull/27) | Video y ZIP archivados en la prerelease con hashes. La tarea entregó posteriormente una versión de 60 segundos con audio; ese corte no se ha incorporado a esta publicación de GitHub. |
| Analiza proyectos y competidores | [Informe y manifiesto de 23 fichas/14 repositorios](investigacion/README.md), [PR #19](https://github.com/Andresssrr24/certiva/pull/19) | Investigación histórica, sin ejecutar aplicaciones rivales ni afirmar un ranking oficial. |
| Contar commits, PRs y líneas | Informes, scripts y 64 JSON de investigación en [PR #19](https://github.com/Andresssrr24/certiva/pull/19) | Métricas de snapshots concretos. No prueban autoría ni funcionalidad y no describen el `main` actual. |

La app Expo tiene su publicación independiente: [Release apk-v0.2](https://github.com/Andresssrr24/certiva/releases/tag/apk-v0.2), actualizada por [PR #26](https://github.com/Andresssrr24/certiva/pull/26)/[PR #28](https://github.com/Andresssrr24/certiva/pull/28). No es la APK nativa `local.certiva.pilot`. [PR #33](https://github.com/Andresssrr24/certiva/pull/33) cambió la tarjeta al Release Expo; PR #35 la dirige al registro del piloto y documenta ese cambio expresamente.

## Evidencia y distribución

- Android nativo: [inicio y menú](ANDROID-INICIO-Y-MENU.md), [API36 y navegación, pendiente de main](https://github.com/Andresssrr24/certiva/pull/36), [diagnóstico histórico Play Protect](android/PLAY-PROTECT-REVISION.md).
- Flujo real anterior: [resultado y límites](evidencias/flujo-real/README.md). Prueba móvil aprobada; instrumentación administrativa fallida por timeout y estado final comprobado por lectura independiente. El éxito de otro caso posterior no reescribe ese fallo.
- Nuevo caso de notificación/menú: evidencia en PR #34 y ZIP `certiva-notificacion-menu-20260911.zip`. Corrida móvil aprobada; consola resolvió el caso, con revisión visual posterior de solo lectura. Incluye intentos fallidos y la grabación administrativa inicial con encuadre deficiente, etiquetados.
- Landing: [contrato, configuración y estado de Play](../landing/BETA-SETUP.md) y [revisión de integración](../landing/BETA-REVIEW.md). El registro está abierto; `BETA_PLAY_READY=false` mantiene pendiente la descarga cerrada. La prueba interna solo sirve a cuentas habilitadas en ese canal; registrarse en el grupo no concede por sí mismo acceso a la lista interna.
- Servicio local: [recuperación del piloto compatible](PILOTO-LOCAL-COMPATIBLE.md). Conservó datos y cuentas existentes. Su base local no se incorpora al repositorio ni se considera la base del nuevo servicio público.

Los resultados QVAC del escritorio y del puente web mantienen su fecha, hardware y alcance. Las cuatro pruebas sintéticas del puente están en [la evidencia de landing](evidencias/landing-qvac.json); no demuestran que el motor corra en Vercel o que funcione en Android. Las mediciones históricas no sustituyen una evaluación de la versión actual.

## Artefactos publicados

La [prerelease de avances](https://github.com/Andresssrr24/certiva/releases/tag/avances-2026-09-11) contiene **22 archivos** en este corte. El [índice actualizado](evidencias/INDICE-RELEASE-20260911.json) registra nombre, tamaño, digest SHA-256 y enlace devueltos por la API de GitHub. Es una consulta del inventario remoto, no una nueva descarga o ejecución de cada binario.

Incluye baselines APK/AAR, variantes nativas 0.2/0.3/0.4, evidencias históricas, demo final de 56 segundos y proyecto editable, flujo Android/consola y nuevo caso de notificación/menú. El [manifiesto inicial](evidencias/MANIFIESTO-ARTEFACTOS-20260911.json) conserva su alcance original; no debe interpretarse como inventario de los archivos añadidos después.

Los ZIP de evidencias conservan pruebas fallidas y sus resultados. El video final y las grabaciones de prueba tienen documentación propia. No se suben AAB firmados de Play, claves, cuentas de revisión, bases SQLite, datos Blob, modelos, dependencias, cachés ni clones de terceros.

## Trabajo posterior sin publicar en este corte

La tarea de landing comunicó pruebas HTTP reales aprobadas del servicio HTTPS de reportes: inicio de sesión, reporte, duplicado, cierre/reinicio de sesión, persistencia y borrado. La preparación Android0.5 y los cambios de privacidad asociados siguen activos; no están congelados ni incorporados a esta PR. Ese resultado HTTP no acredita todavía el recorrido de reportes desde Android0.5 ni aprobación del canal cerrado de Play.

Se mantiene la separación entre cortes revisados y trabajo en curso. Los cambios de las tareas se publican después de revisar archivos concretos y evidencias, sin sobrescribir el checkout compartido ni copiar credenciales o datos personales de prueba.

## Android 0.5 incorporado en este corte

[PR #37](https://github.com/Andresssrr24/certiva/pull/37): Ingresar/Mis reportes por HTTPS, confirmación de envío mínimo y borrado de reportes propios. Conserva API36 como base y apunta a main. Dos pruebas nativas aprobadas en API35 contra el HTTPS real; no se reejecutó la suite completa durante la publicación. [Fuentes y alcance](android/REPORTES-HTTPS-ANDROID.md). El backend se entrega por separado y no se incluye material de firma o credenciales.
