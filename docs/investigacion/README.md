# Investigación archivada del 10 de septiembre de 2026

Este archivo conserva el trabajo de las tareas de competidores y métricas. Los informes describen sus commits y fechas de consulta; no representan el estado actual de los repositorios ni un ranking oficial.

- [Comparación de 23 fichas y 14 repositorios](dojo-analysis-2026-09-10/INFORME.md), con [manifiesto de consulta](dojo-analysis-2026-09-10/repos-snapshot.json).
- [Conteo amplio de actividad y código](dojo-metrics-2026-09-10/METRICAS.md).
- [Clasificación de código de producto y límites de autoría](dojo-metrics-2026-09-10/PRODUCTO-Y-AUTORIA.md): corrige el alcance del conteo amplio; no certifica originalidad ni funcionalidad.
- [Certiva en el commit 35339b8](dojo-metrics-2026-09-10/CERTIVA-PRODUCTO.md). Las cifras no incluyen las integraciones posteriores.

Se conservan scripts propios de auditoría, manifiestos por archivo y salidas JSON. Los scripts son auxiliares históricos: algunos requieren GitHub CLI autenticado, cloc 2.10 y cachés de fuentes descargadas; no son una herramienta empaquetada ni deben ejecutarse automáticamente al instalar Certiva. `certiva-count.py` usa la disposición original de carpetas y debe apuntarse al checkout correspondiente al repetirlo.

Las copias de código de competidores, sus repositorios `.git`, compilados y la copia local de cloc se mantienen fuera del producto. Las referencias de commit permiten recuperar los originales desde sus fuentes y bajo sus propias licencias. Se omitió `luma-files.json`, un intermedio incompleto; el manifiesto y conteo final de Luma están incluidos. Las rutas personales de los JSON se normalizaron a `<workspace>` sin cambiar sus mediciones.

Los informes no acreditan haber ejecutado las aplicaciones rivales ni reproducido sus benchmarks. Las observaciones sobre acceso al repositorio de Certiva, su ficha y su cobertura corresponden al corte histórico indicado.
