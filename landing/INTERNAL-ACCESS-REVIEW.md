# Acceso a la prueba interna tras el registro

11 de septiembre de 2026. Corte congelado de `public/probar.html` comunicado por la tarea de landing, con despliegue READY `dpl_GZtZF5TRFQb583yNdLbdotMxysy1` y alias [registro de Certiva](https://certiva-landing.vercel.app/probar).

## Cambio

El bloque `beta-success` incorpora un enlace a la prueba interna de Google Play y una nota: sincronización programada cada 5 minutos mientras el equipo esté conectado, misma cuenta de Google y cupo máximo de 100 verificadores. Si Play todavía no reconoce acceso, se puede intentar más tarde. El enlace no se presenta como confirmación de inclusión efectiva en la lista interna.

El bloque sigue oculto inicialmente. `beta.js` lo muestra con registro confirmado y lo oculta para visitantes nuevos o ante fallos de consulta. El enlace de prueba cerrada conserva su validación y permanece oculto con `BETA_PLAY_READY=false`. No cambian OAuth, consentimiento ni backend en este corte.

## Evidencia

- SHA-256 del HTML congelado/desplegado: `80342f5e95ae9bd2f90a2de9bf70c05d45d0d553cde17c001e9a8bc736ad4860`.
- GET público de `/probar` coincide byte a byte con ese corte.
- La integración recupera únicamente el comentario Biome del enlace cerrado sin href inicial; por ello su HTML difiere del desplegado solo en comentario y saltos de línea.
- Tres pruebas existentes de estados beta aprobadas en esta integración. Comprueban visibilidad de `beta-success` y condiciones del enlace cerrado con dobles del DOM; no verifican la lista de Google Play.
- Inspección estructural del HTML: el nuevo enlace interno está dentro de `beta-success`, inicialmente oculto.
- Biome del HTML y `git diff --check`: sin errores.
- La tarea propietaria informó build correcto y las mismas tres pruebas aprobadas. No se repitió el build ni un login real desde esta integración.

## Operación fuera de Git

Bryan autorizó incorporar los registros actuales y futuros a la prueba interna, según la tarea propietaria. Esta confirmó cuatro integrantes guardados tras unir la lista sin eliminar los existentes, y una automatización activa cada 5 minutos. La sincronización depende del host, Chrome, una ejecución correcta y el cupo disponible; no garantiza acceso dentro de cinco minutos. Esta revisión no ejecutó ni auditó la automatización y no comprobó una instalación física desde Play.

No se incorporan correos individuales, credenciales, archivos de cuentas ni configuración privada de automatizaciones. La prueba abierta y la cerrada 0.5 siguen sin aprobación confirmada. Las correcciones de cuota del backend todavía no se han desplegado, según el último estado comunicado.
