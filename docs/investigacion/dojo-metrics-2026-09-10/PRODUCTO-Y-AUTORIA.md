# Código de producto y límites de atribución

Instantánea: 2026-09-11T04:21:37.085026+00:00. No se actualizó el estado remoto para esta reclasificación.

**Resultado: 68.932 líneas físicas clasificadas como código de producto; NO 68.932 líneas de autoría original demostrada.**

El conteo anterior de 114.076 era más amplio e incluía pruebas, herramientas y archivos que la clasificación por extensión no distinguía, como HTML de revisión de datos y una compilación en dist-final. La clasificación nueva se basa en rutas y revisión de archivos. Es una estimación de alcance de producto, no una medida de esfuerzo, calidad o desarrollo humano frente a IA.

| Proyecto | Conteo anterior | Producto seleccionado | Excluido |
|---|---:|---:|---:|
| [AEGIS AI](https://github.com/BLeandro5/AEGIS_AI) | 30.609 | 9.992 | 20.617 |
| [Ina Igar](https://github.com/0xj4an/Hackathon-ISD-2026) | 14.257 | 9.864 | 4.393 |
| [ATLAS](https://github.com/jlbjulio/ATLAS) | 9.477 | 7.728 | 1.749 |
| [MAM](https://github.com/pixeltabletop/jajanken-hackathon) | 7.957 | 7.060 | 897 |
| [Chen](https://github.com/pixeltabletop/Narukami---Hackathon) | 8.706 | 6.551 | 2.155 |
| [Salus / Onvia](https://github.com/Vortecsmaster/Onvia) | 6.859 | 4.889 | 1.970 |
| [ClikToTrip](https://github.com/JVeraPTY/clik2trip-sovereign) | 8.321 | 4.439 | 3.882 |
| [PULSO](https://github.com/jlbjulio/PULSO) | 5.523 | 4.356 | 1.167 |
| [DevCors](https://github.com/HernandoSilvaLeal/expediente-local) | 9.749 | 4.135 | 5.614 |
| [Luma](https://github.com/george888-q/luma-Inteligencia-de-Base-Instalada-de-Clientes) | 4.191 | 3.834 | 357 |
| [SAJA](https://github.com/jdb17-hub/SAJA_HACKATHON) | 4.518 | 3.695 | 823 |
| [FleetSense](https://github.com/alioth-stat/phillips-installed-base-intelligence) | 2.330 | 1.525 | 805 |
| [Zarpe](https://github.com/Jast-2281/qvac-hackathon-panama) | 1.046 | 792 | 254 |
| [TrustMesh](https://github.com/srbisnes/SRBISNES) | 533 | 72 | 461 |

## Qué se cuenta

Lógica, interfaces, estilos, persistencia y adaptadores en las rutas seleccionadas. Se excluyen pruebas, entrenamiento, herramientas, documentación, configuraciones de compilación, marketing, datos y componentes genéricos identificados. Las exclusiones por archivo completo pueden descartar pequeñas adaptaciones o lógica mezclada con datos. No se ha demostrado que cada pantalla esté conectada o cada integración funcione. Las simulaciones que constituyen la propia aplicación permanecen identificadas como tales.

Los manifiestos *-product-manifest.json registran archivo, líneas, inclusión y motivo. product-count.py conserva los criterios. Código medido con cloc 2.10, timeout 30 s por archivo, sin blancos/comentarios. Se verificó que los totales por archivo cuadran con el total del contador.

## Bases declaradas y diferencias

Se descargaron las versiones de los archivos actuales seleccionados que existen en el commit base, conservando las mismas rutas, y se compararon con cloc --diff. No es auditoría de todas las fuentes externas, ni seguimiento completo de código trasladado entre archivos. Cambiar formato o reescribir una línea tampoco demuestra originalidad.

- **Chen:** 4151 líneas añadidas + 166 modificadas = **4317 líneas distintas respecto a la base**; 2234 iguales. [Base declarada](https://github.com/pixeltabletop/Narukami---Hackathon/commit/57af18aa6a8e94a16a639022b4a41f559d784190). No demuestra autoría original de las líneas distintas.
- **ATLAS:** 7640 líneas añadidas + 84 modificadas = **7724 líneas distintas respecto a la base**; 4 iguales. [Base declarada](https://github.com/jlbjulio/ATLAS/commit/c0d250fd001493d136e2c6ebb7d8b136712db5ec). No demuestra autoría original de las líneas distintas.

## Observaciones por proyecto

- **AEGIS AI:** Se excluyen 17.572 líneas de HTML de revisión de entrenamiento, además de pruebas y herramientas. Autoría original no acreditada por el conteo.
- **ATLAS:** Declara prototipo previo c0d250f. Comparación disponible abajo; no equivale a prueba de autoría.
- **Chen:** Declara base Rastro importada de Diego Laverde en 57af18a. 2.234 líneas actuales coinciden con esa base en las rutas comparadas.
- **ClikToTrip:** Se excluye catálogo demo (1.467 líneas) y tokens de marca preexistentes (48), además de pruebas/evaluación. tourism.ts mezcla catálogo heredado y código de recuperación nuevo: no se atribuye íntegramente como nuevo.
- **DevCors:** Se excluyen 3.333 líneas de pruebas y 2.281 de scripts; core, UI, malla, IA, instancia bancaria y CLI permanecen.
- **FleetSense:** Se excluyen conservadoramente 535 líneas de componentes genéricos shadcn/ui; podría haber adaptaciones propias entre lo excluido.
- **Ina Igar:** Plantilla previa declarada de metodología y documentación, fuera de este conteo. Se excluyen landing, evaluación, spikes, generadores e instrumentación de demo.
- **Luma:** Se excluyen pruebas, video, arranque y configuración. No se acredita originalidad de cada línea.
- **MAM:** Declara trabajo durante el hackatón, con scaffolding electron-vite y reemplazo de su ejemplo. Se cuenta runtime; declaración no auditada línea por línea contra todos los upstreams.
- **PULSO:** Declara estructura, configuración, esquemas y scripts previos. No hay frontera exacta acreditada aquí para descontar toda esa base.
- **SAJA:** Reconoce evolución de SAJA_HACKATHON y referencia a qvac-project-phillips. No se puede atribuir todo a creación desde cero.
- **Salus / Onvia:** Se excluyen dist-final, pruebas, galería, semillas y scaffolding nativo. Incluye 75 líneas de adaptadores simulados que sí son código de su aplicación; esto no prueba IA funcionando.
- **TrustMesh:** Solo trustmesh-ai: aplicación de simulación determinista. Código muy condensado; 72 líneas físicas no equivalen a 72 instrucciones.
- **Zarpe:** Se excluyen tests e index.js, que es un script previo para probar el SDK. Declara el producto escrito durante el hackatón.

## Conclusión de atribución

No existe un total exacto verificable de líneas originales escritas por cada equipo a partir de estos datos. Las bases declaradas y algunos componentes permiten descontar casos concretos. Ausencia de una declaración no es prueba de originalidad; tampoco hay base para acusar copia no declarada.
