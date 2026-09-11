# Certiva · portal de escritorio y centro de seguridad

El portal de Electron empieza en la pantalla de inicio de un teléfono simulado. Elegir un caso entrega el mensaje fuera de Certiva, ejecuta el motor QVAC de escritorio y presenta una notificación dentro del teléfono. Tocar esa notificación abre las señales, el consejo y el botón de reporte. El indicador inferior vuelve al inicio del teléfono.

Los mensajes del menú son ficticios. La inferencia del portal es real cuando los modelos están disponibles. El simulador no es un emulador Android ni recibe WhatsApp. Las alertas nativas Android 0.2 se incorporarán en una entrega separada después de su validación.

## Portal

Desde la raíz del repositorio:

```sh
npm start
```

Solo ejecutar un motor QVAC a la vez. La primera revisión puede incluir carga y descarga de modelos. Los ejemplos se deshabilitan si faltan los modelos de visión y texto. Los detalles de modelos, señales, tiempos y JSON están en «Ver análisis y evidencia técnica».

### Centro de seguridad

- Generar casos sintéticos de enlace para robo de clave, solicitud de OTP, dispositivo nuevo o intentos repetidos.
- Seleccionar un caso, tomarlo, registrar solicitudes de verificación/cambio de clave/cierre de sesiones y resolver o descartar la revisión.
- Las solicitudes no ejecutan cambios en un banco ni envían mensajes al cliente. No hay conexión al core bancario.
- El historial y estado se conservan en `casos-piloto.json`, en el directorio de datos de la aplicación Electron. No guarda texto del mensaje. Es un registro local de demostración, sin autenticación de analistas ni garantía de inmutabilidad.
- Los indicadores de pares existentes siguen disponibles en «Inteligencia compartida».
- «Abrir reportes de la APK» abre la consola autenticada en `http://127.0.0.1:4320`. Los reportes reales del piloto móvil se gestionan allí con sus roles, control de concurrencia y auditoría. Se mantienen separados de los casos sintéticos locales de Electron.

## Comprobaciones del portal

```sh
# Pruebas de motor, evaluación y ciclo de los casos
npm test

# Recorrido UI con un resultado controlado, sin cargar QVAC
npx electron scripts/prueba-experiencia.js
```

La prueba de interfaz usa una ventana oculta, un preload de pruebas y un registro temporal de casos; genera capturas en `tmp/`, excluido de Git. Comprueba inicio del teléfono, mensaje entrante, apertura del mensaje, alerta sin apertura automática, detalle al tocar, reporte, solicitud de medida y cierre con historial.

En la rama integrada pasaron **11 pruebas Node**, **9 comprobaciones UI** y **136/136 veredictos de reglas sobre el texto sintético conocido**. Se verificó sintaxis de JavaScript y Biome de ocho archivos: sin errores y con 12 advertencias. Se revisaron las capturas del recorrido a tamaño normal y con ventana reducida.

La prueba UI de esta rama se ejecutó con Electron 40.10.2 del runtime local de verificación; la dependencia declarada del proyecto sigue siendo Electron 42.5.0. El motor UI controlado no acredita inferencia QVAC ni efectividad antifraude. La tarea de implementación reportó un recorrido QVAC real previo; no se repitió en esta integración para no ocupar su worker.

## Reportes del piloto móvil

La app Android incluida hasta ahora corresponde a la base 0.1: entrada de texto y compartir hacia Certiva. Sus instrucciones y evidencia están en [la guía del piloto](../pilot/README.md) y [la validación de la versión base](../pilot/VALIDACION.md). La siguiente entrega de notificaciones Android 0.2 se comprueba aparte y no forma parte de este PR del portal.
