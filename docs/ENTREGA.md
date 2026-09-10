# Lista de verificación para la entrega en Dojo · antes del jueves 11 a las 07:00

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

- [ ] Nombre del proyecto decidido; renombrar el repo con `gh repo rename <nombre>` y actualizar el enlace del README.
- [ ] `npm run lint` sin errores y `node eval/reglas-check.js` en 120 de 120.
- [ ] `eval/results.md` con la última corrida y las métricas copiadas al README.
- [ ] Etiqueta `git tag v1.0-hackathon && git push --tags`.
- [ ] Ningún secreto en el repo: `git log -p | grep -iE "api[_-]?key|secret|token" | head`.
- [ ] El capitán entrega en Dojo, marca los tres tracks y guarda una captura de la confirmación.
