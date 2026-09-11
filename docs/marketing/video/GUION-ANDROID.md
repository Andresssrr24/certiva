# Demo Android de Certiva

Estado actualizado: baseline 0.1 congelado en `pilot/artifacts/v0.1.0/certiva-pilot-0.1.0-debug.apk`. SHA256 comprobado desde video: `cdbc727dcacc41b2c92a6db3068035717e1ba020b34ada58f838575323a4c5a5`. La tarea del piloto reportó dos pruebas Android aprobadas: motor/configuración firmada y login/reporte/consulta. Falta recibir grabación del recorrido real. No es una entrega de video terminada. Sustituye la dirección abstracta rechazada y toma el movimiento nativo de la muestra v2 como referencia provisional.

El emulador `CertivaPilot` (`emulator-5580`) fue cedido a la tarea de notificaciones para 0.2. Se solicitó turno o grabación a esa tarea; no controlar ni reinstalar en paralelo. La versión 0.1 no incluye notificaciones. No mezclar su hash con imágenes de 0.2.

Alcance comprobado en código y documentación: texto pegado o compartido; reglas JavaScript locales con configuración firmada; sin OCR ni QVAC Android. El reporte usa la consola local 4320 y requiere sesión de cliente más confirmación. Las pruebas de funcionamiento fueron reportadas como aprobadas; la filmación aún no está completada.

Preparada composición nativa `motion-android-v3.js`: apertura de 3,5 s, grabación completa sin acelerar y cierre de 3,5 s. Exige metadatos de captura verificada antes de construir. Ajustar encuadre tras ver la toma real. No renderizada todavía.

## Recorrido previsto

| Plano | Imagen y movimiento | Texto visible | Evidencia necesaria |
|---|---|---|---|
| Apertura, 3 s | Firma aprobada sobre azul #205094; entrada breve de palabras | Antes de responder, verifica | Activos de marca existentes |
| Abrir la app, 4 s | Grabación de Android abriendo Certiva; encuadre vertical con acercamiento suave | Certiva · Tu aliado contra el fraude | APK instalado en dispositivo o emulador identificado |
| Revisar mensaje, 6 s | Introducir un mensaje sintético de suplantación en el flujo disponible; resaltar la acción real | Un mensaje te pide tu código | Campo y botón presentes en la app final |
| Analizar, duración real | Pulsación y espera auténticas; conservar una toma continua de respaldo | Analizando | Motor, ubicación y duración medidos en Android; si se recorta la espera, indicarlo en pantalla |
| Entender el resultado, 7 s | Resultado real; acercamiento a uno o dos motivos que realmente devuelve | Revisa las señales antes de actuar | Respuesta registrada; no escribir motivos adicionales sobre la interfaz |
| Reportar, opcional 6 s | Revisar datos y confirmar un reporte sintético | Tú decides si reportarlo | Solo incluir si el APK implementa el flujo; comprobar recepción en consola |
| Cierre, 3 s | Volver al conjunto de la app y firma aprobada | Antes de responder, verifica | Identificar la entrega como piloto Android según su estado real |

La duración final depende del análisis medido y del reporte disponible. Sin llamada simulada, transferencia ni integración bancaria no implementada. Datos sintéticos identificados discretamente durante el recorrido.

## Animación y composición

- Pantalla real como elemento central; texto, subrayados, máscaras, acercamientos y transiciones nativas Higgsedit.
- Azul plano #205094, blanco y Manrope para textos editoriales; conservar firma gráfica aprobada.
- No regenerar pantallas con modelos de video. Los estados de la app deben provenir de capturas o grabación del APK.
- Mantener visible suficiente contexto para entender cada acción. Un acercamiento no debe ocultar avisos relevantes del piloto.
- Si se muestra la consola, identificarla como consola web y conservar trazabilidad del reporte de prueba. No aparentar una aplicación oficial del banco.

## Material de entrega pendiente

APK con versión o hash; dispositivo y Android utilizados; toma continua de la interacción; motor realmente usado y dónde corre; medición del análisis; MP4 final revisado; proyecto editable. La evidencia de QVAC en Mac es soporte del desarrollo y no sustituye estos materiales.
