# Validación Android QVAC 0.3

Estado: integración experimental, pendiente de validación en teléfono físico.

## Integración de avances del 11 de septiembre

Sobre la rama aislada basada en `main` se reconstruyó el bundle QVAC y pasaron APK, APK de pruebas y lint (149 tareas, 30 segundos), las regresiones JVM y **16 pruebas de la API**. Se mantuvieron las señales de pago y la paridad del SDK ya integradas en `main`, además del contrato `qvac_texto`/`0.3.0-qvac`. [Build](evidence/integration-build.txt) · [API](evidence/integration-api.txt). La app aislada de diagnóstico también compiló (65 tareas, 27 segundos). No se repitió inferencia Android durante esta integración. La APK recompilada tiene SHA-256 `023ebbfc083c4fda0b74990d3bc14d8dda26f990db44e69bdbdc11f2da9d6ce3`; sus fuentes conservan el SDK integrado y no se le atribuye la prueba visual de otra APK.

Los cuatro intentos de recorrido UI completo se conservan como fallidos en `docs/evidencias/android-ui/`, con su resultado y salida instrumentada. La prueba separada de iconos sí pasó; no convierte los recorridos fallidos en aprobados. Los binarios y grabaciones se distribuyen como artefactos experimentales, fuera del código fuente.

## Evidencia obtenida

- La app aislada `local.certiva.qvacprobe` ejecutó el addon QVAC 0.49.1 y Qwen3 1.7B Q4_K_M sobre CPU en Android 15 arm64. Su manifiesto no concede INTERNET.
- La primera prueba nativa logró inferencia, pero falló la clasificación del mensaje que pedía un código. Se conserva el resultado completo en `evidence/native-initial.json`.
- El diagnóstico posterior identificó una combinación problemática: `json_schema` junto con presupuesto de razonamiento positivo provoca un error del grammar sampler. La versión actual solicita JSON sin grammar, limita el razonamiento y valida estrictamente los cuatro campos booleanos antes de usar el resultado.
- El diagnóstico nativo en Mac de esa corrección pasó los tres casos sintéticos (solicitud de código, conversación cotidiana y advertencia de no compartir códigos), con 10,2–12,8 s de inferencia. Este diagnóstico no sustituye la prueba Android.
- La primera repetición Android con el clasificador corregido agotó los 120 s al cargar/iniciar, en un emulador de 4 GB con presión de memoria e intercambio. Evidencia: `evidence/native-reasoning-cold-timeout.json`. No cuenta como una prueba aprobada. Una repetición también agotó ese límite: `evidence/native-reasoning-retry-timeout.json`. Se cerró la prueba para liberar el emulador.
- Las comprobaciones de combinación pasaron en JVM con Java 17 y `org.json:json:20240303`: preservar riesgo y abstención, admitir señales permitidas, descartar prosa, rechazar señales desconocidas, conservar la procedencia de reglas cuando falla la IA, no mutar el resultado original y no presentar ausencia de IA como evaluación completada. Código: `checks/RegressionRunner.java` y `probe/src/main/java/local/certiva/probe/MergeChecks.java`. Resultado: `evidence/java-merge-checks.txt`. Estas comprobaciones no prueban la inferencia Android.
- Las compilaciones de APK de app/prueba y lint terminaron correctamente. La prueba del contrato HTTP de reportes pasó 14 casos, incluida la procedencia QVAC y la proyección de datos mínimos.

## Alcance de la prueba

Son pruebas de integración con mensajes sintéticos, no una medición de eficacia contra fraude. No prueban WhatsApp real, teléfonos Samsung, autonomía de batería ni funcionamiento continuo con restricciones del fabricante.

La inferencia y las alertas son locales. La descarga inicial del modelo necesita Internet o provisión por USB. El envío voluntario de reportes usa la API de reportes. El historial local de alertas funciona sin ella. Si la IA falla, un riesgo que ya detectaron las reglas se conserva con `coverage=reglas_de_texto`, su procedencia original y `aiStatus=unavailable`. La interfaz lo indica; no se atribuye a QVAC. Un resultado sin señales de las reglas no se convierte en aprobación cuando falla la IA.

## Pendiente

- Repetir los tres casos con la corrección en la app Android sin INTERNET.
- Probar notificación sintética → inferencia QVAC → almacenamiento mínimo → alerta → apertura en la app completa.
- Verificar modelo, versión de Android, RAM y rendimiento del teléfono conectado una vez autorizado en ADB.

## Repetir las comprobaciones JVM

Con Java 17 y el JAR `org.json:json:20240303` descargado de Maven Central, desde este módulo:

```sh
javac -cp /ruta/json-20240303.jar -d /tmp/certiva-checks src/main/java/local/certiva/qvac/LocalAssessment.java probe/src/main/java/local/certiva/probe/MergeChecks.java checks/RegressionRunner.java
java -cp /ruta/json-20240303.jar:/tmp/certiva-checks local.certiva.probe.RegressionRunner
```
