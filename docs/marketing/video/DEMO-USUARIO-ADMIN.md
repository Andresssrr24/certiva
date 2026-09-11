# Demo funcional: usuario y administradores

Requisito expreso de Bryan: ver en vivo cómo funciona desde ambos roles. Los cortes de capturas animadas no satisfacen esta entrega.

## Un caso, dos roles

1. Usuario Android: introducir un mensaje sintético, verificarlo con el motor real de la versión elegida y mostrar resultado y motivos. Conservar la duración real del análisis.
2. Usuario: revisar los datos que se enviarán y confirmar el reporte. Registrar el identificador que devuelve la API de la consola 4320.
3. Analista: actualizar la bandeja y abrir ese MISMO identificador, revisar motivos y origen del reporte, tomar el caso y registrar una resolución acorde a la evidencia disponible.
4. Auditoría: mostrar la creación, asignación y resolución del caso.
5. Usuario: consultar el nuevo estado de su reporte si la versión permite este recorrido.

No atribuir a Android el caso web antiguo c3c5a186. No sembrar un caso directamente en la base para aparentar recepción desde la APK. Las credenciales se ingresan antes de grabar.

## Motor y versiones

Baseline comprobado: APK 0.2 con reglas locales, SHA256 e25d74d5478d14fcac8c5b47494c194483a64d4c68124290c03d4b9c81818a06. Sus pruebas previas usaron API aislada 4321; el flujo completo hacia la consola de demo 4320 debe verificarse durante esta grabación. QVAC Android 0.3 todavía no tiene una ejecución confiable para este demo: no presentar resultados controlados como inferencia.

Texto sintético reproducible sugerido por la tarea Android: «Su cuenta será bloqueada hoy. Envíe el código de verificación al atacante.» No afirmar fraude confirmado ni actuar como si fuera evidencia de un cliente real.

## Producción

Conservar tomas originales, hash APK, motor, fecha, ID evaluación y ID caso. El montaje une móvil y consola con el ID visible. Motion graphics: firma aprobada, rótulos «Usuario» y «Equipo de protección», acercamientos a los motivos y al estado, cierre. No reemplazar la interacción por capturas.

Estado de coordinación: consola 4320 cedida a video, sesión de analista abierta antes de grabar. Emulador 5580 cedido por protección. La herramienta CUA no reconoce qemu; se solicitó a Bryan autorización explícita para interacciones ADB. Esa autorización está pendiente al escribir esta nota.
