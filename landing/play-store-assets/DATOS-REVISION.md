# Datos y acceso · revisión 0.4

Borrador técnico, no declaración final enviada.
Fuente: tmp/play-release-20260911/pilot/android-app y android-qvac.
Mensajes/notificaciones se procesan localmente; historial de 20 resultados por
7 días, sin texto original, remitentes, enlaces ni códigos. ModelInstall descarga
por HTTPS desde Hugging Face, que recibe IP y datos técnicos. Falta mapear sus
registros a categorías y usos de Play; no asumir ausencia de recopilación.

PilotAPI permite solo localhost4320/4321. Cuentas asignadas fuera de la app, sin
alta desde ella ni servidor público de reportes. OAuth de la landing es separado.

Borrador Play: sí hay recopilación/compartición por descarga del modelo; HTTPS
para transmisión fuera del dispositivo; sin creación de cuentas desde la app;
cuentas externas asignadas manualmente. Eliminación opcional sin contestar.
Tipos, usos y envío final pendientes.

No se certificó acceso completo a todas las funciones. Bryan conserva los
reportes y conectará el servicio después. Público18+ aprobado pero bloqueado
por ese requisito. IARC requiere nuevas condiciones. Auto-review bloqueó la
etiqueta IA del icono/gráfico por exigir confirmar origen y autorización.
Las dos capturas son originales de emulador.

Referencias:
- https://support.google.com/googleplay/android-developer/answer/10787469
- https://support.google.com/googleplay/android-developer/answer/9859455#app_access
- https://huggingface.co/privacy
- https://support.google.com/googleplay/android-developer/answer/17262077
- https://web.iarcservices.com/terms
