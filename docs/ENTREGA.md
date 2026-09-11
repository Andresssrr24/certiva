# Lista de verificación para la entrega en Dojo · antes del viernes 11 de septiembre de 2026 a las 07:00 (margen interno; cierre oficial 08:00 Panamá)

Una sola entrega por equipo, inscrita en los tracks **General**, **Caja de Ahorros** y **QVAC Psy**.

## Descalifica si falta

- [ ] **Base preexistente declarada** en el README: `qvac-invoice-manager-demo` y los otros ejemplos de `tetherto/qvac-examples`. Ya está; no borrarla.
- [ ] **Ninguna inferencia en la nube,** ni como respaldo. Buscar en el código llamadas externas: `grep -rn "fetch(\|https://" lib main.js renderer scripts` y confirmar que solo hay descargas de modelos y enlaces del README.
- [ ] **Repositorio accesible al jurado durante toda la evaluación:** hacerlo público el 11 temprano (`gh repo edit --visibility public`), o dar acceso al jurado si prefieren privado.
- [ ] **Video de máximo cinco minutos** con enlace sin credenciales (YouTube sin listar). Abrirlo en una ventana de incógnito antes de pegarlo.

## Para el reto Psy

- [ ] Licencia permisiva: `LICENSE` Apache-2.0 y `NOTICE`. Ya están.
- [ ] Registro de rendimiento estructurado: `eval/perf.jsonl` con carga de modelo, prompts, tokens, TTFT y throughput. Se regenera con `npm run eval`.
- [ ] Hardware declarado y nombres de modelo con cuantización: sección «Modelos y hardware declarados» del README.
- [ ] Instrucciones de reproducibilidad: `docs/COMO-PROBAR.md`.
- [ ] APIs remotas y componentes de terceros divulgados: sección «Base preexistente» del README más `package.json`.

## Antes de enviar

- [x] Nombre del proyecto decidido: **Certiva**; repo renombrado a `certiva` (la URL anterior redirige) y enlaces actualizados.
- [ ] `npm run lint` sin errores y `node eval/reglas-check.js` en 120 de 120.
- [ ] `eval/results.md` con la última corrida y las métricas copiadas al README.
- [ ] Etiqueta `git tag v1.0-hackathon && git push --tags`.
- [ ] Ningún secreto en el repo: `git log -p | grep -iE "api[_-]?key|secret|token" | head`.
- [ ] El capitán entrega en Dojo, marca los tres tracks y guarda una captura de la confirmación.

## Validación final de esta rama

- Ejecutar `npm test` y `npm run lint`.
- Repetir evaluación completa: las métricas 98,3% son anteriores a la segunda lectura.
- Demostrar inferencia con internet desconectado y modelos ya descargados.
- Demostrar P2P por separado en LAN; el contador TCP no mide UDP ni todo el tráfico.
- Mostrar llamada como simulación con audio sintético y prototipo como aplicación de escritorio.
- Verificar repo y vídeo desde una sesión sin credenciales; guardar comprobante de entrega.
