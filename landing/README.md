# Certiva · Landing

Producción: https://certiva-landing.vercel.app

Vercel READY: `dpl_P19pL2xQN8V2zXsGr6sMdaartW16` (11 septiembre 2026 UTC).

Landing independiente con branding v5, verificador de texto local y puente optativo al motor QVAC del proyecto. No modifica la app Electron ni utiliza su política sintética como si fuera de Caja de Ahorros.

## Web

Node 22.17 o superior. No requiere instalar paquetes para construir o servir la landing.

```sh
npm run dev
npm test
npm run build
vercel --prod
```

La vista previa usa http://127.0.0.1:4317. Vercel publica exclusivamente `dist/`. Nunca publica el puente, el repositorio del prototipo ni los modelos. El verificador funciona en el navegador sin enviar el texto a Vercel. El informe JSON se descarga localmente y puede contener dominios y evidencias, pero no incluye el mensaje completo.

## QVAC

QVAC no corre en funciones de Vercel. El usuario conecta un puente que escucha exclusivamente en 127.0.0.1:4318. El SDK y los modelos se ejecutan en ese mismo equipo; no permite conectarse al Mac del autor desde otros dispositivos.

1. En la raíz `antifraude-qvac`, ejecutar `npm ci`. En `landing`, ejecutar `npm run qvac:prepare`: descarga VisionPsy y Qwen3, los dos modelos usados por la landing. Reservar espacio para las dependencias nativas y los modelos (varios GB).
2. Cerrar otras aplicaciones/procesos QVAC: comparten un worker.
3. En `landing`, ejecutar `npm run qvac`.
4. Abrir el enlace de conexión directa que imprime el puente, o pegar la clave temporal de la terminal en «Conectar motor QVAC local». La clave viaja en el fragmento de la URL, no en la petición HTTP a Vercel; la página retira ese fragmento del historial al recibirlo. La clave solo vive en memoria y se renueva al reiniciar el puente.
5. Permitir acceso a red local si el navegador lo solicita. Si el navegador bloquea el acceso desde HTTPS, usar la vista local `npm run dev`.

El estado «Puente conectado» comprueba conectividad y disponibilidad del SDK, no afirma que los modelos estén cargados. La inferencia se solicita al analizar; los fallos se informan sin simular resultados de QVAC. Se rechazan orígenes no autorizados, hosts de rebinding, claves inválidas, rutas arbitrarias e imágenes mayores de 5 MB. Una sola inferencia a la vez. Capturas temporales borradas al terminar la lectura.

Orígenes aceptados: preview local y https://certiva-landing.vercel.app. Para otro dominio exacto, pasar `CERTIVA_ALLOWED_ORIGIN=https://dominio` al iniciar el puente. Nunca exponer el puerto por túneles públicos ni agregar comodines.

La lectura usa `Motor.extraerCaptura` (VisionPsy); el veredicto usa `Motor.veredicto` (Qwen3) y las reglas de la web. No se usa el RAG de Banco Demo. Las acciones y enlaces permanecen controlados por la aplicación. Una imagen sin señales tras una sola transcripción se presenta como no concluyente, no como auténtica.

## Referencias verificadas

- Branding: `../MEMORIA_PROYECTO.md` y `../docs/marketing/brand/certiva-aplicaciones-azul-v5.png`.
- [Seguridad de Caja de Ahorros](https://www.cajadeahorros.com.pa/recomendaciones-seguridad-bancaria/): teléfono 800-2252 y canales enlazados. Revisado el 10 de septiembre de 2026, hora de Panamá.
- [SDK QVAC](https://docs.qvac.tether.io/js-ts-sdk/): ejecución nativa en Node/Bare/Expo, no como SDK web directo.
- Manrope: Google Fonts, licencia OFL en `public/assets/OFL-Manrope.txt`. Tipografía de interfaz aproximada; no es el master tipográfico del wordmark aprobado.

## Validación y límites

Pruebas Node: ejemplos, dominios engañosos, negaciones, vacíos, urgencia, autenticación, CORS, validación y SDK ausente. Los tests HTTP del puente utilizan un doble explícito, no prueban inferencia real. No se realizó inspección visual en navegador. WebMCP tiene registro opcional con detección de soporte; no se pudo validar en un contexto compatible.

El bloqueo inicial de espacio quedó resuelto después de que Bryan liberó disco. Instalación completa: @qvac/sdk 0.19.0 y modelos VisionPsy Nano 460M Flash + Qwen3 4B Q4_K_M. Verificación real con `npm run qvac:verify`: cuatro casos aprobados a través del puente HTTP usando el origen público de la landing. En Apple M1 Pro / 16 GiB: phishing de texto 35,429 ms (primera carga), petición de código 20,588 ms, aviso informativo 17,866 ms y captura sintética 29,960 ms. Evidencia: `../tmp/landing-qvac/verification.json`. Esto prueba el SDK y el contrato HTTP; el permiso de red local y la conexión desde cada navegador aún dependen de ese navegador. Para repetir la prueba, detener previamente otros procesos QVAC. La landing y el análisis de texto por reglas no dependen del SDK.

Certiva es un prototipo independiente. No hay conexión a APIs bancarias, cuentas, transacciones, denuncias enviadas ni aval de Caja de Ahorros. Las reglas pueden producir falsos positivos y falsos negativos. Una ausencia de señales no confirma autenticidad.

## Cesión temporal del worker

El puente permite pausar QVAC sin perder la clave ni cerrar HTTP. `SIGUSR2` pausa solo cuando no hay análisis en curso y descarga los modelos; mientras tanto, `/health` informa `paused:true` y los análisis devuelven 503 explicativo. `SIGHUP` reanuda. Enviar señales únicamente al PID verificado del puente, después de coordinar con la otra tarea. Confirmar la pausa y ausencia de worker antes de iniciar otra app QVAC. La clave puede conservarse durante un reinicio autorizado mediante `CERTIVA_PAIR_TOKEN` (64 caracteres hexadecimales); no guardar claves en archivos públicos ni en Git.
