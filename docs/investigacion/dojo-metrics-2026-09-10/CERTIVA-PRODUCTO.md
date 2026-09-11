# Certiva: código de producto y procedencia

Repositorio: [https://github.com/Andresssrr24/certiva](https://github.com/Andresssrr24/certiva). Rama main, commit `35339b846c4f0368d3856fbc12f99c64657434a4`. Conteo 2026-09-11T04:29:54.617682+00:00.

## Resultado

| Concepto | Líneas |
|---|---:|
| Producto seleccionado | 7163 |
| Fuera de los cuatro archivos declarados derivados | 6100 |
| En los cuatro archivos declarados derivados | 1063 |
| Estilos CSS dentro del producto | 2557 |
| Código de producto distinto de CSS | 4606 |

Los 1.063 renglones de archivos derivados NO son 1.063 renglones copiados: contienen adaptación propia y código de origen. No se ha hecho una comparación línea por línea contra el commit original de qvac-examples. Los otros 6.100 están fuera de los archivos declarados derivados; tampoco constituyen certificación independiente de autoría.

## Alcance

Mismo criterio de comparación que la revisión de competidores: fuente de aplicación, interfaz, estilos, motor y adaptadores. Excluye pruebas, scripts de investigación, datasets, docs, landing de marketing, instrumentación de benchmark, configuración y copias generadas. Conserva pares-worker y radar porque ejecutan funciones del producto, aunque estén bajo scripts/.

Se contaron 35 archivos. cloc 2.10 sin líneas vacías ni comentarios. Se fijó el commit remoto y verificó cada archivo contra su SHA de blob. No se incorporaron PRs abiertos ni cambios locales, y no se ejecutaron las aplicaciones. Este inventario no demuestra funcionamiento de integraciones ni ausencia de partes simuladas.

Tres bundles generados certiva.js de 362 líneas cada uno fueron excluidos: 1.086 líneas de copias del motor/SDK que ya se cuenta por sus fuentes. El conteo amplio de 10.195 corresponde solo a las extensiones y directorios seleccionados en certiva-count.py, no a cada archivo textual del repositorio.

## Partes del producto

- Motor y escritorio: 5838 líneas.
- Móvil Expo: 387 líneas.
- Piloto, SDK y apps nativas: 938 líneas.

## Archivos con derivación declarada

- `lib/analizar.js`: 403 líneas actuales.
- `main.js`: 400 líneas actuales.
- `lib/modelos.js`: 210 líneas actuales.
- `preload.js`: 50 líneas actuales.

Fuente de procedencia: README y NOTICE del proyecto, ejemplo qvac-invoice-manager-demo de tetherto/qvac-examples.

## GitHub al consultar

77 commits en el historial de main. 11 PRs: 8 fusionados y 3 abiertos. El repositorio está activo y puede avanzar después de esta captura.

Criterio y manifiesto detallado: certiva-product-metrics.json.
