# Flujo real de alerta y reporte en emulador

Instrumentación aprobada: 53.496 s. APK 0.4 congelada SHA8ee2f1d708149db3043e2de50b40df441116bf67244ed8ea654b0a63486b468f. Original 47.171256 s,720×1600; SHA y metadatos en result.json.

Entrada de prueba visible → servicio de notificaciones y motor reales → alerta nativa → tap real → detalle → Inicio/Menú/Alertas/Verificar → consentimiento real → POST y recibo real. Assessment 1de8045a-1df9-4433-80fe-0a9210539f8b, caso b63be9f8-f051-4873-a4a8-9823254f8711. receipt-frame.png verifica el recibo en el final del vídeo.

La entrada es sintética y está rotulada Demo en emulador. Se adjuntó el servicio mediante ServiceTestCase y se habilitó temporalmente su procesamiento. No demuestra WhatsApp real, onboarding de permisos ni entrega real del sistema al listener. El motor ejecutó reglas locales, sin assessment insertado; aiStatus unavailable. Los motivos reales son solicitud de datos sensibles y urgencia. La autenticación fue mediante API real y nunca se mostró la contraseña. Las preferencias anteriores se restauraron.

Primera toma fallida conservada en ../notification-menu-real-20260911-01: el servidor anterior rechazaba un código nuevo del SDK. La toma aprobada usa servidor compatible commit5216166 con datos conservados. Otro falso positivo de motivo en el texto anterior permanece documentado en ../../demo-preparation/notification-menu-v04/INTEGRATION-FINDINGS.md; no se corrigió con este vídeo.

No todas las etapas grabadas tienen vídeo a frecuencia constante; los timestamps del test y PTS del archivo deben alinearse visualmente. El montaje final pertenece a la tarea de vídeo.
