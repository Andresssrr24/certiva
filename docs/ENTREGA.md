# Lista de verificación para la entrega en Dojo · antes del viernes 11 de septiembre de 2026 a las 07:00 (margen interno; cierre oficial 08:00 Panamá)

Una sola entrega por equipo, inscrita en los tracks **General**, **Caja de Ahorros** y **QVAC Psy**.

## Descalifica si falta

- [ ] **Base preexistente declarada** en el README: `qvac-invoice-manager-demo` y los otros ejemplos de `tetherto/qvac-examples`. Ya está; no borrarla.
- [ ] **Ninguna inferencia en la nube,** ni como respaldo. Buscar en el código llamadas externas: `grep -rn "fetch(\|https://" lib main.js renderer scripts` y confirmar que solo hay descargas de modelos y enlaces del README.
- [ ] **Repositorio accesible al jurado durante toda la evaluación:** la tarjeta de Dojo ya apunta a `https://github.com/Andresssrr24/certiva`, pero el repo sigue privado y Dojo solo acepta repos públicos. Hacerlo público antes de enviar: `gh repo edit Andresssrr24/certiva --visibility public`.
- [ ] **Al hacer público el repo, abrir el QR del README desde un teléfono sin sesión de GitHub** y comprobar que el Release apk-v0.1 descarga.
- [ ] **Video de máximo cinco minutos** con enlace sin credenciales (YouTube sin listar). Abrirlo en una ventana de incógnito antes de pegarlo.

## Para el reto Psy

- [ ] Licencia permisiva: `LICENSE` Apache-2.0 y `NOTICE`. Ya están.
- [ ] Registro de rendimiento estructurado: `eval/perf.jsonl` con carga de modelo, prompts, tokens, TTFT y throughput. Se regenera con `npm run eval`.
- [ ] Hardware declarado y nombres de modelo con cuantización: sección «Modelos y hardware declarados» del README.
- [ ] Instrucciones de reproducibilidad: `docs/COMO-PROBAR.md`.
- [ ] APIs remotas y componentes de terceros divulgados: sección «Base preexistente» del README más `package.json`.

## Antes de enviar

- [x] Nombre del proyecto decidido: **Certiva**; repo renombrado a `certiva` (la URL anterior redirige) y enlaces actualizados.
- [ ] `npm run lint` sin errores, `npm test` en verde y `node eval/reglas-check.js` en 136 de 136.
- [ ] La última corrida en `eval/runs/<fecha>/` y sus métricas copiadas al README. Hoy el README lleva la corrida de 136 (83,1 % antes de la corrección) más la verificación por subconjuntos tras corregir la segunda lectura; si hay 25 minutos libres con el worker de QVAC desocupado, `npm run eval` y actualizar la tabla.
- [x] Rama `apk-movil` mergeada a `main` (PR #12, 11 de septiembre).
- [x] APK publicado en el [Release apk-v0.1](https://github.com/Andresssrr24/certiva/releases/tag/apk-v0.1) con SHA-256 en las notas, y el enlace en la sección «App móvil y APK» del README.
- [ ] Publicar el APK 0.3.0 (marca Certiva y app de cuatro pestañas; rama `apk-marca-certiva`, 229 MB, SHA-256 `9a5165c4…5d4099`) como Release `apk-v0.2`, y apuntar ahí el enlace del README, el QR y `mobile/antifraude-release-arm64.apk.sha256`.
- [ ] Ningún secreto en el repo: `git log -p | grep -iE "api[_-]?key|secret|token" | head`.
- [x] **Tarjeta del proyecto creada en Dojo** (borrador, 11 de septiembre): nombre *Certiva*, tracks General + Caja de Ahorros + QVAC Psy, plataforma Mobile-First, descripción, logo y banner de la lámina v5 ([logo](marketing/brand/certiva-logo-512.png) · [banner](marketing/brand/certiva-banner-3x1.png)), enlace del repositorio y Live Demo con la landing.
- [ ] **Pegar el enlace del video** en «Link to your demo» de la tarjeta, con el repositorio ya público.
- [ ] **«Submit & participate» en Dojo:** bloquea el proyecto para la evaluación, así que es el último paso. Guardar una captura de la confirmación.

## Validación final de esta rama

- Ejecutar `npm test` y `npm run lint`.
- Repetir evaluación completa: las métricas 98,3% son anteriores a la segunda lectura.
- Demostrar inferencia con internet desconectado y modelos ya descargados.
- Demostrar P2P por separado en LAN; el contador TCP no mide UDP ni todo el tráfico.
- Mostrar llamada como simulación con audio sintético y prototipo como aplicación de escritorio.
- Verificar repo y vídeo desde una sesión sin credenciales; guardar comprobante de entrega.
