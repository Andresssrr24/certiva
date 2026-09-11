# Avances reunidos de las tareas de Certiva

Corte: 11 de septiembre de 2026. Se revisaron los inventarios de las ocho tareas del proyecto y el checkout compartido. Las copias se integraron en ramas independientes, conservando las correcciones que ya estaban en `main`.

| Tarea | Resultado publicado o conservado | Estado y alcance |
|---|---|---|
| Añadir alertas push para fraudes | Iconos en PR13/15; UI nativa y scripts de prueba en [PR18](https://github.com/Andresssrr24/certiva/pull/18) | Los iconos tienen evidencia visual. Los recorridos nativos completos conservan sus fallos; no se consideran aprobados. |
| Probar esto en Android | Runtime, instalador, aplicación de diagnóstico, API y evidencias QVAC en PR18 | Borrador experimental: dos timeouts del clasificador Android corregido. |
| Diseñar producto para banca y USDT | [PR17](https://github.com/Andresssrr24/certiva/pull/17): texto directo y advertencia temprana; piloto y propuesta bancaria ya integrados | USDT queda fuera del alcance vigente. Las condiciones comerciales son hipótesis. |
| Review decentralized AI hackathon | PR17: contactos bancarios, fuentes, comparación y orientación | Consulta histórica con fecha; coincidencia no autentica al remitente. |
| Crear landing Certiva interactiva | Código y sitio ya publicados; [evidencia QVAC](evidencias/landing-qvac.json) archivada | Cuatro casos sintéticos con puente local. El motor no corre en Vercel. No se reactivó el puente durante esta integración. |
| Crear video motion graphics | [Guiones, composiciones y enlaces a videos/editables](marketing/video/README.md) | Corte visual de 23 s con capturas animadas. La demo funcional APK → reporte → mismo caso en consola sigue sin grabar. |
| Analiza proyectos y competidores | [Informe y manifiesto de 23 fichas/14 repositorios](investigacion/README.md) | Investigación histórica; no ejecución de aplicaciones rivales ni ranking oficial. |
| Contar commits, PRs y líneas | Informes, scripts propios y 64 JSON de investigación en `docs/investigacion/` | Métricas de snapshots concretos. No prueban autoría ni funcionalidad y no describen el `main` actual. |

## Comprobaciones de integración

- Portal: 18 pruebas Node, 12 comprobaciones de recorrido y prueba de contactos aprobadas, con backend controlado y Electron 40.10.2.
- Android experimental: bundle reconstruido; APK, APK de pruebas y lint aprobados en 30 s; app de diagnóstico compilada en 27 s; 16 pruebas API y regresiones JVM aprobadas. Se conservaron las señales de pago del SDK integrado. No se repitió inferencia Android.
- Documentación y herramientas: 64 JSON validados y sintaxis Python/JavaScript comprobada. No se ejecutaron los scripts de adquisición de competidores ni un nuevo render.
- Las observaciones históricas de latencia y precisión conservan su fecha, hardware, versión y limitaciones; no se reinterpretan como validación actual.

## Artefactos

Las APKs, AAR, hashes y evidencias se publican en la [prerelease de avances](https://github.com/Andresssrr24/certiva/releases/tag/avances-2026-09-11). El [manifiesto](evidencias/MANIFIESTO-ARTEFACTOS-20260911.json) distingue los baselines 0.1/0.2, la APK 0.2 con iconos, el snapshot 0.3 y la recompilación experimental con el SDK integrado.

El ZIP de evidencias incluye capturas, logs y grabaciones históricas, incluidas pruebas UI fallidas etiquetadas en `result.json`. No es una demo funcional final. Los videos de marketing ya alojados conservan sus enlaces y estado en su documentación. La release Expo `apk-v0.1` es otro entregable y mantiene sus instrucciones propias.

## Criterio de archivo

Avances posteriores al corte inicial: [inicio Android renovado, PR21](https://github.com/Andresssrr24/certiva/pull/21), con dos pruebas UI aprobadas, y [landing con favicon, ejemplos, guía y QR](../landing/README.md). La APK home de SHA-256 `21542a5afe71591a1327fb39878e8044adaf77dd7aaaec27d347465de7dec942` se añadió a la prerelease con sus metadatos y se sirve públicamente desde la landing. Sigue siendo experimental; no acredita detección QVAC validada.

Se preservó todo el código y documentación nuevos identificados en los inventarios. El checkout compartido conserva sus archivos y su rama. Las variantes locales antiguas de README, reglas, bundles SDK, dataset, licencias y branding no reemplazan correcciones posteriores de `main`. El PDF v1 local coincide con el histórico ya versionado y no se duplicó.

Los modelos GGUF, dependencias, cachés, directorios de compilación, credenciales, bases SQLite y clones de terceros no forman parte del código publicado. Sus fuentes y mecanismos de reconstrucción se documentan donde corresponde. Los ajustes encargados después de este corte se incorporan como avances posteriores, con su propia evidencia.

- Landing: simulador web de teléfono Android con tres casos, notificaciones y detalle; navegación por accesos, inicio y Escape. Fuentes integradas sobre main tras la limpieza de Biome, siete tests y flujo DOM aprobados. La APK no cambia; la demostración usa reglas locales y no valida QVAC Android.
- Archivadas las fuentes y evidencias del formulario Android y la consola para el mismo caso: [resultado y límites](evidencias/flujo-real/README.md). Prueba móvil aprobada; instrumentación administrativa fallida por timeout, con estado final verificado por lectura independiente. Incluye grabaciones originales en la release y corrección posterior del recorder, sin nueva ejecución.
