# Demo web de Certiva

11 de septiembre de 2026. La tarea de landing congeló cuatro archivos y confirmó el despliegue READY `dpl_6SeepzYMkJS8Zohh9WQUiG94ctYJ`, con alias [demo de Certiva](https://certiva-landing.vercel.app/demo).

## Comportamiento

La ruta `/demo` reutiliza los ejemplos del teléfono interactivo y el análisis local de texto. No requiere registro ni instalación. `/probar` conserva un botón visible hacia la demo mientras la descarga de Play sigue pendiente. La pantalla identifica el uso de reglas y no presenta esta interacción como una ejecución de Android o QVAC.

`demo.html` conserva los 83 IDs del index para compartir `app.js`. `demo.css` oculta las secciones de instalación, tecnología, preguntas, cierre, conexión QVAC y selección de capturas. El HTML conserva esas secciones ocultas de la página original, incluido texto histórico 0.4; no se retiraron porque comparte inicialización con la landing. La ruta se define mediante rewrite en `vercel.json`. No cambia el contrato de OAuth ni activa la descarga de Play.

## Inventario recibido

SHA-256 del corte congelado de la tarea propietaria:

| Archivo | SHA-256 |
|---|---|
| `public/demo.html` | `9e8f5f8b85935f645c6c68394a02922abfe59a1c208b74079b97348de5ed5c66` |
| `public/demo.css` | `0d100c97151806706f1d67958c2360caf312c4391e4906d405f27a4055d6e767` |
| `public/probar.html` | `68a3c8c4131d7cdf87dcc964368f11bfd91bf68270c47d1fc6158cfafd02e832` |
| `vercel.json` | `b1381a958d91f76b124bafa65bcb07e0d427c9570ab207f42b0d3d07d86e8ab9` |

La integración solo formatea el CSS y recupera el comentario de lint del enlace Play oculto sin href inicial. Por ello, esos dos archivos difieren en formato/comentario del corte desplegado; HTML de demo y rewrite se conservan exactamente.

## Comprobaciones

- Suite del worktree de integración: **30/30 PASS**. El primer intento tuvo dos fallos EPERM al abrir el puerto temporal del puente; la repetición con permiso para localhost pasó completa. No ejecuta QVAC ni modifica cuentas reales.
- Build: **PASS**, incluida la comprobación de tamaño y SHA del APK histórico requerido por el constructor. Se verificaron los recursos de la demo en `dist` y el rewrite.
- HTML: 83 IDs únicos y el mismo conjunto del index original.
- Biome de los cuatro archivos: sin errores; un aviso por `!important` para ocultar controles en la variante demo.
- GET públicos de `/demo`, `/demo.css` y `/probar`: coinciden byte a byte con el inventario congelado. El primer intento con Python falló por su almacén local de certificados; curl del sistema permitió verificar TLS sin desactivarlo.
- La tarea propietaria comunicó comprobación visual en producción del teléfono y análisis de un texto sintético de petición de código, con señales de datos sensibles y urgencia. Esta integración no repitió esa interacción en navegador.

Las correcciones de cuota y aprovisionamiento de PR #38 siguen pendientes de incorporarse al despliegue. La prueba abierta y la cerrada de Android 0.5 están enviadas a revisión según su tarea propietaria; no hay aprobación ni descarga confirmadas. `BETA_PLAY_READY=false` se mantiene.
