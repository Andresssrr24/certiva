# Hallazgos reales previos a la segunda toma

## 1. Servidor local anterior al SDK de la APK 0.4

La primera ejecución (`pilot/artifacts/notification-menu-real-20260911-01`) verificó llegada simulada, procesamiento real por el listener, alerta nativa, tap, detalle y navegación. Al confirmar el reporte recibió HTTP 400 con «Reporte inválido o vencido». La instrumentación quedó fallida. Consulta SQLite de solo lectura: **cero casos** para assessment `aa200c86-8baf-4173-90d8-dff51f040975`.

La APK congelada SHA `8ee2f1d708149db3043e2de50b40df441116bf67244ed8ea654b0a63486b468f` incluye `envio_para_recibir` y `cambio_direccion`. El proceso 4320 (PID original 32804, cwd checkout raíz/pilot) usaba fuentes anteriores que no admitían esos códigos. Integración coordina el cambio de servicio a las fuentes compatibles de main, preservando la carpeta de datos y credenciales. Este archivo no acredita que ese cambio ya se haya realizado.

Actualización antes de toma 2: el propietario de integración confirmó el servicio compatible en 4320, PID 74776, cwd `/Users/bryanlarez/Documents/DESARROLLO/certiva-piloto-local/pilot`, commit `5216166`. Verificó 16/16 pruebas de contrato, incluyendo ambos códigos, y coincidencia byte a byte de `certiva.js`, `policy.json` y `policy-key.txt` con la APK congelada. Conservó la base, usuarios y casos; no envió reportes durante la actualización. El falso positivo descrito abajo sigue separado.

## 2. Motivo de envío de dinero incorrecto para una solicitud de código

El texto sintético «Su cuenta será bloqueada hoy. Envíe el código de verificación para desbloquearla.» produce en esta APK:

- `pide_datos_sensibles`: coherente.
- `envio_para_recibir`: **falso positivo de motivo**; el texto solicita un código, no dinero.
- `urgencia`: coherente.

`ListenerMetadataTest` reprodujo el resultado con el servicio y motor reales, sin login ni POST. Evidencia `listener-metadata-diagnostic.json` en la carpeta de la primera toma. El resultado global de riesgo sigue siendo apropiado, pero el motivo adicional es incorrecto. La captura final no corrige ni acredita resuelto este problema: usa un texto inequívoco de solicitud de claves y documenta el límite.

Procedencia confirmada por UI/Menu: su commit 4df8a7a no modificó reglas ni SDK; ambos motivos ya estaban en su base 5b850e7. Historial: d2cf189 añadió reglas, a25d132 SDK compartido; fc6d2f5 fue el último cambio del SDK Android señalado por ese propietario.

## 3. Segundo ejemplo, verificado antes de capturar

«Su cuenta será bloqueada hoy. Dígame por favor su clave y el código de verificación.»

`input-preflight.json` documenta ejecución de las reglas y política reales incluidas en la base de la APK: riesgo y únicamente `pide_datos_sensibles`, `urgencia`. Esto es una comprobación del SDK en JavaScript; la prueba posterior sigue obligada a verificar el motor Android, el consentimiento y el recibo real del mismo assessment.
