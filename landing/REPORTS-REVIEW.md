# Revisión del servicio HTTPS de reportes

Corte del 11 de septiembre de 2026. Fuentes congeladas recibidas de la tarea de landing, integradas en copia aislada. API con rutas limitadas, sesión cifrada/revocable y CSRF, cuentas asignadas, datos mínimos, almacenamiento privado con control de versiones y aislamiento por cuenta.

## Hallazgos corregidos

1. **El borrado reiniciaba la cuota horaria.** Reproducción en almacenamiento simulado:30 envíos→erase→nuevo envío devolvía 201 en vez de 429. La cuota usa ahora marcas horarias separadas, conservadas al borrar, con compatibilidad para cuentas existentes. La regresión cubre bloqueo inmediato y nuevo envío tras vencer la hora.
2. **El script permitía carpetas privadas dentro de otros clones.** La protección original dependía del nombre antifraude-qvac. Ahora comprueba Git y la ruta real antes de leer variables o crear credenciales. La prueba cubre otro nombre de repositorio, worktree, enlace simbólico y directorio externo con modo 0700.

La política explica las marcas temporales sin contenido del reporte. La prueba no consulta contraseñas ni aprovisiona cuentas reales. La tarea propietaria mantiene el control del despliegue; estas correcciones todavía no estaban desplegadas en el último estado confirmado.

## Validación

- Suite completa: **30/30 PASS**:20 previas,9 de reportes y1 de directorio privado.
- Build correcto con comprobación de la APK histórica exigida por el sitio; salida pública sin scripts de aprovisionamiento ni fuentes de servidor.
- Biome aplicado solo a archivos de este corte, sin errores.
- Cliente Blob 2.7.0 fijado en lockfile. Sus tipos/documentación de la instalación confirman que ifMatch implica allowOverwrite y useCache:false lee del almacenamiento de origen.
- GET público independiente: reports/health devuelve ready:true; beta/status mantiene enabled:true y playReady:false. No se ejecutaron escrituras ni inicios de sesión reales durante esta revisión.
- La tarea propietaria reporta pruebas HTTP reales e instrumentación Android 0.5,2/2en 6.242 s. Esas pruebas corresponden al despliegue anterior a las correcciones de cuota; no se reetiquetan como prueba de la versión corregida.

Sin credenciales, datos Blob/SQLite ni AAB en Git. La publicación de prueba interna no acredita aprobación del canal cerrado, instalación física, Android16 ni inferencia QVAC.
