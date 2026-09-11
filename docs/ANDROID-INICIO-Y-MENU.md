# Inicio y menú de Certiva Android

La versión 0.4 organiza la aplicación nativa en cuatro secciones. La apertura usa el icono aprobado y el azul #205094. No añade una espera artificial ni obliga a iniciar sesión para verificar un mensaje.

| Sección | Contenido y acciones |
| --- | --- |
| Inicio | Acción principal para revisar un mensaje, estado de los cinco requisitos de protección, accesos a reportes y guía, último resultado guardado. |
| Verificar | Canal, texto editable, ejemplo, análisis existente, motivos y confirmación de reporte. |
| Alertas | Resultados locales de los últimos siete días, detalle de cada alerta y acceso a protección. |
| Menú | Cuenta de reportes, protección, alertas, reportes, configuración de IA, guía, privacidad e información del piloto. |

La barra inferior permanece visible. Cambiar de sección conserva el borrador, canal y resultado en memoria. Al recrear la actividad se recuperan el borrador, canal y sección; el análisis o resultado en curso no se persiste. Atrás desde una sección vuelve al inicio. Compartir texto desde otra aplicación abre Verificar directamente. Abrir un resultado desde una alerta conserva el flujo existente de consentimiento para reportar.

La configuración y el número de alertas proceden del estado local. Una lista vacía no se presenta como prueba de protección activa. No se incluyen casos o cifras de demostración en la interfaz normal. Los accesos ejecutan acciones existentes: no se simulan conexiones bancarias.

QVAC Android sigue siendo experimental. Estos cambios no validan inferencia local, recepción real de WhatsApp ni conexión con un banco. El motor, la política de análisis y los datos enviados en reportes no cambian.

## Comprobaciones

- Compilar con `:app:assembleDebug :app:assembleDebugAndroidTest` y ejecutar `:app:lintDebug`.
- `HomeScreenTest`: entrada vacía, ejemplo, acceso a protección y texto compartido.
- `NavigationScreenTest`: navegación, conservación de borrador, Atrás, recreación de actividad, apertura de modelo/protección y detalle de una alerta controlada. El contenido de alerta de prueba se restaura al terminar.
- Revisar capturas del inicio, verificador, alertas y menú en el emulador y con texto ampliado.

Las evidencias de la ejecución final acompañan a la APK; esta lista describe cobertura y no sustituye al resultado de ejecución.

## Evidencia final

La APK final compila y pasa lint (0 errores, 24 advertencias). Las seis pruebas nativas pasan juntas en Android 15/API35; el recorrido adicional con texto al 130 % también pasa. [Resultados y capturas](evidencias/menu-ui-20260911/README.md).

La barra inferior mantiene superficies opacas y se redibuja como una capa pequeña para evitar que queden iconos o etiquetas sin pintar al cambiar secciones. La comprobación de píxeles verifica las cuatro celdas en las cuatro capturas finales.
