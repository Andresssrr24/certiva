# Certiva · Landing

Producción: https://certiva-landing.vercel.app

Vercel READY: `dpl_2Q1DqqeRZ2bbcrmUyS5pRYDWMyZR` (11 septiembre 2026 UTC).

Landing independiente con branding v5, verificador de texto local y puente optativo al motor QVAC del proyecto. No modifica la app Electron ni utiliza su política sintética como si fuera de Caja de Ahorros.

## Web

Node 22.17 o superior. Ejecutar `npm ci` en `landing/` para instalar la dependencia del registro beta.

```sh
npm ci
npm run dev
npm test
npm run build
vercel --prod
```

La vista previa usa http://127.0.0.1:4317. Vercel sirve el contenido estático de `dist/` y las funciones `api/beta/`. El puente y los modelos siguen siendo locales. El verificador funciona en el navegador sin enviar el texto a Vercel. El informe JSON se descarga localmente y puede contener dominios y evidencias, pero no incluye el mensaje completo.

## Registro beta preparado

`/probar` ofrece acceso a la prueba interna para las cuentas ya habilitadas. El registro automático permanece desactivado por defecto; necesita configuración completa y `BETA_ENABLED=true`. El código confirma la identidad con Google, usa su correo verificado para añadirlo al grupo de pruebas y comprueba la membresía antes de mostrar el acceso cerrado. Los secretos se configuran fuera de Git.

En esta rama, el botón abre `/probar` y el QR vuelve a la ruta estable `/apk`, que redirige a `/probar`. Este cambio sustituye el destino Expo introducido en PR #33 para que QR y botón anuncien la misma prueba nativa 0.4. La APK Expo sigue disponible en su Release. El binario nativo 0.3 continúa como artefacto histórico y requisito del build, no como destino del botón beta.

Estado y requisitos: [BETA-SETUP.md](BETA-SETUP.md). Revisión independiente: [BETA-REVIEW.md](BETA-REVIEW.md). `npm run dev` sirve archivos estáticos y no emula las funciones ni el flujo OAuth; las pruebas de servidor emplean dobles y no dan de alta usuarios reales. Esta PR no acredita un despliegue, una instalación desde Play ni el recorrido completo en navegador.

La política Android está en `/privacidad-app`, separada de la privacidad del registro web. Los [materiales de la ficha es-419](play-store-assets/README.md) se conservan como borrador y `.vercelignore` excluye esa carpeta del despliegue. No acreditan aprobación de Google Play; continúan pendientes acceso completo para revisores, declaraciones y clasificación.

Los apartados de despliegue que siguen documentan revisiones anteriores y sus comprobaciones históricas.

## QVAC

QVAC no corre en funciones de Vercel. El usuario conecta un puente que escucha exclusivamente en 127.0.0.1:4318. El SDK y los modelos se ejecutan en ese mismo equipo; no permite conectarse al Mac del autor desde otros dispositivos.

1. En la raíz `certiva`, ejecutar `npm ci`. En `landing`, ejecutar `npm run qvac:prepare`: descarga VisionPsy y Qwen3, los dos modelos usados por la landing. Reservar espacio para las dependencias nativas y los modelos (varios GB).
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

## Interactive examples and Android download

The primary demo offers three synthetic cases and computes the result with local browser rules, even when a QVAC bridge is connected. A collapsed panel preserves manual text/capture analysis. The five-step Android guide supports numbered tabs, keyboard arrows/Home/End, next/back and sample copying with a selection fallback. The favicon is the approved native Certiva launcher PNG.

`/apk` redirects to the latest frozen experimental Android 0.3 package under `public/downloads/`. The QR encodes this stable HTTPS route. Packages use a SHA prefix in the filename to avoid stale cached downloads; version, size, architecture and digest are published in `public/downloads/manifest.json`. APK binaries are intentionally not duplicated in Git; before deployment copy the exact frozen pilot artifact to the manifest filename and verify its SHA-256. Never deploy a build still being modified by another task.

Android 0.3 requires Android 13+ ARM64 and downloads a separate 1.1 GB model. It is explicitly marked experimental: neither a successful model download nor interface checks validate end-to-end QVAC fraud detection on Android. This scope is different from the verified desktop QVAC bridge above.

Latest frozen APK source: `../pilot/artifacts/home-ui-20260911/certiva-0.3-home-experimental.apk`, SHA-256 `21542a5afe71591a1327fb39878e8044adaf77dd7aaaec27d347465de7dec942`. Public filename: `certiva-0.3-qvac-experimental-21542a5a.apk`. Owner reports build/lint and two Android home UI checks passed; this does not validate QVAC inference or physical WhatsApp reception. Landing build now stops if package bytes or digest mismatch the manifest.

For this update: 7 existing Node tests passed, JavaScript syntax and HTML structure/ID references checked, actual SVG QR decoded to the public `/apk` route, copied APK SHA/size/ZIP integrity verified. No browser visual QA was performed.

Production verification: public root, QR, favicon, manifest and `/apk` return 200. `/apk` resolves to the 71,201,693-byte home revision SHA21542a5a with APK MIME and attachment disposition. Public HTML contains the demo and all five steps. Server bridge and build-source paths return 404. Production deployment `dpl_2Q1DqqeRZ2bbcrmUyS5pRYDWMyZR` is READY and aliased to https://certiva-landing.vercel.app.

Scope clarification: the corrected Android QVAC classifier timed out in two emulator runs and has no completed physical-device validation. Public copy and manifest say Android AI detection remains unvalidated, without implying successful emulator inference.

## Reconstruir desde un clon

El APK publicado está disponible sin iniciar sesión en GitHub. Desde `landing/`, obtener la versión congelada y ejecutar el build, que comprueba tamaño y SHA-256 antes de copiarla:

```sh
curl --fail --location https://certiva-landing.vercel.app/downloads/certiva-0.3-qvac-experimental-21542a5a.apk --output public/downloads/certiva-0.3-qvac-experimental-21542a5a.apk
npm run build
```

El archivo binario queda ignorado por Git. También está archivado en la prerelease `avances-2026-09-11` del repositorio, cuyo acceso requiere autorización mientras sea privado. La integración de fuentes pasó las siete pruebas Node y el build con la APK congelada; no se realizó una inspección visual adicional en navegador.

## Android phone demonstration (reference alignment)

The hero now contains an interactive Android handset based on the supplied reference and existing native demonstration: wallpaper, status bar, source/Certiva notifications, app icons, and gesture navigation. Scenario selection updates a real browser-rule assessment. Notifications and app shortcuts open message/detail views inside the handset; Home, back buttons, Escape and restart return to the home screen. The original manual verifier and desktop QVAC connection remain in a collapsed section. This is an explicitly labeled web simulation, not an embedded Android runtime or a claim that SMS/email background protection works in the APK.

Changed: `public/index.html`, `public/app.js`, added `public/android-demo.js`, `public/android-demo.css`, `public/assets/android-wallpaper.svg`. APK unchanged. Seven existing tests pass. A lightweight DOM test using temporary LinkeDOM exercised notification → detail → message, app shortcuts, switching to the informational case clearing prior risk signals, replay and Escape. HTML nesting, IDs, controls, links/assets and JS syntax passed. No screenshot or browser visual QA performed for this revision.

Android phone revision deployed READY at https://certiva-landing.vercel.app/?v=android-1#verificar. The existing browser tab was navigated to that URL; the handoff accessibility state showed the phone home, both notifications and four app shortcuts. No screenshot/visual comparison performed.

Integración sobre `main` con Biome: preservadas las correcciones de la guía, el nombre `escapeHtml` y callbacks sin retorno; grupos de ejemplos con `fieldset`, SVG decorativos explícitos y título inicial accesible. Siete tests y prueba DOM repetidos sobre esta revisión, build correcto. Biome termina sin errores y con cinco avisos de especificidad CSS entre selectores de componentes diferentes. Estos ajustes de integración posteriores al despliegue se entregan en el PR.
