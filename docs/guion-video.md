# Video de entrega — plan de grabación (≈ 5 minutos, español)

Objetivo: 4:40 de duración para dejar margen; máximo 5:00. Rúbrica general: técnica 35, innovación 25, impacto 20, diseño 10, completitud 10. Por eso el video dedica más tiempo a la prueba técnica (sin internet, modelos, pares) que a la interfaz.

## Formato y herramientas

- **Pantalla por escenas, voz después.** Cada escena se graba como un archivo aparte con `Cmd+Shift+5` → «Grabar parte seleccionada» sobre la ventana de la app (1380×920). Sin narrar en vivo: las esperas de los modelos no se sincronizan con la lectura.
- **Montaje en iMovie** (viene en el Mac): juntar las escenas, cortar esperas con rótulo, añadir los rótulos como títulos, «Grabar voz en off» sobre la línea de tiempo ya cortada, exportar a 1080p.
- **Publicar:** YouTube «no listado», probar el enlace en una ventana de incógnito, pegar el enlace en Dojo, en el README y en [ENTREGA.md](ENTREGA.md).
- Si se pasa de 5:00, recortar la escena 5 (hardware y resultados), nunca la 1.

## Antes de grabar

1. **Una sola app QVAC en la máquina.** La app se abre desde `main` con `PARES_PUERTO=4411 npx electron .`. No correr evaluación ni `scripts/prueba-*.js` mientras se graba.
2. **Calentar modelos:** analizar una tarjeta y simular una llamada una vez antes de grabar; la primera carga es más lenta y no vale la pena mostrarla.
3. **Reportes en limpio:** borrar `~/Library/Application Support/Electron/reportes.json` si existe, para que «Reportar este mensaje» aparezca sin usar.
4. **Mac limpio:** «No molestar» activado, Dock oculto, escritorio vacío, resolución por defecto (no «Más espacio»), ninguna ventana con datos personales detrás.
5. **Red:** el Wi-Fi se apaga desde la barra de menús, en cámara, al empezar la escena 1. Para la escena 4 hace falta red local: Wi-Fi del lugar o un hotspot de teléfono con datos apagados. El contador «Nube» solo cuenta conexiones a IPs públicas; los pares de la red local no suman.
6. **Segunda laptop (escena 4):** repo clonado, `npm install`, y

   ```bash
   node scripts/radar.js --directo <ip de la primera>:4411 --sin-swarm --emitir dominio:bancodemo-pa.app
   ```

   La IP de la primera sale con `ipconfig getifaddr en0`. El radar no necesita modelos. Si el enjambre de Hyperswarm responde en esa red, `node scripts/radar.js` a secas también sirve; el modo directo es el plan seguro.
7. **Captura ambigua a mano:** `data/capturas/legitimo-oficial_con_urgencia-01.png`, arrastrada al teléfono. No usar la `-05`, que en la última corrida salió «fraude».
8. **Voz:** auriculares con micrófono o el micrófono del Mac en un cuarto silencioso. Leer el texto de cada escena tal cual; corregir solo lo que suene raro en voz alta.

## Escenas

### 0. Gancho y tesis — 0:00 a 0:30

Pantalla: la app en la pantalla de inicio, tarjeta «SMS: «cuenta bloqueada»» visible. Rótulo: «Certiva · Tu aliado contra el fraude» y debajo «Motor anti-fraude en el dispositivo · QVAC».

> Este mensaje le llega a un cliente de la Caja de Ahorros: «su cuenta fue bloqueada, entre aquí». El enlace se parece al oficial y pide el código. Cada día alguien cae. Esto no es otra app: Certiva es un motor anti-fraude que el banco mete en su propia app. Corre en el teléfono del cliente, y el banco recibe la señal sin recibir nunca el mensaje.

### 1. Sin internet, análisis completo — 0:30 a 1:40

Clics: Wi-Fi apagado desde la barra de menús → señalar «Nube: 0» arriba → tarjeta «SMS: «cuenta bloqueada»» → esperar el veredicto → «Reportar este mensaje». El panel «Detrás de escena» queda visible todo el tiempo. Rótulo: «Wi-Fi apagado · todo corre en este Mac». Si se corta una espera en el montaje: «Corte: espera de N s».

> Apago el Wi-Fi. Arriba dice «Nube: cero»: ninguna conexión a internet durante todo el análisis. Abro la captura. Primero VisionPsy, el modelo de visión de QVAC, lee la pantalla y transcribe el mensaje. Luego las reglas del banco: aquí encuentran un dominio parecido al oficial y una petición de código. Después una segunda lectura con OCR, solo para confirmar frases. Y al final Qwen3, el modelo de lenguaje, redacta el veredicto siguiendo la política anti-fraude del banco, que consulta por RAG. Veredicto: fraude. Explica por qué en lenguaje llano, dice qué hacer y da el canal oficial. Tardó [leer el tiempo del panel] segundos en este Mac. El panel de la derecha muestra cada etapa con su tiempo y el JSON completo.

### 2. Legítimo y ambiguo — 1:40 a 2:15

Clics: tarjeta «SMS: código de verificación» → veredicto → arrastrar `legitimo-oficial_con_urgencia-01.png` al teléfono → veredicto. Cortar esperas con rótulo.

> Un SMS legítimo con un código de verificación: sin señales. Importante: «sin señales» no autentica el mensaje; solo dice que el motor no encontró indicios. Y una captura ambigua, un aviso oficial con prisa: el motor responde «sospechoso» y, cuando sus dos lecturas no coinciden, se abstiene en vez de tranquilizar. Preferimos abstenernos a equivocarnos.

### 3. Llamada de vishing — 2:15 a 3:00

Clics: «Simular llamada de vishing» → dejar correr hasta el aviso → «Colgar» → pantalla de fin de llamada con el resumen. Rótulo fijo durante toda la escena: «Simulación con audio sintético (voces de macOS), procesado por lotes de 5 s».

> Ahora una llamada. Es una simulación con audio sintético, voces de macOS, procesada por lotes de cinco segundos; no capturamos llamadas reales. Parakeet transcribe en el dispositivo mientras la llamada avanza. Cuando el «ejecutivo» pide el código, salta el aviso: cuelgue, el banco nunca pide esto. El cliente cuelga antes de darlo. Al terminar, un resumen de lo que pidió la voz. Nada de esta llamada salió del teléfono.

### 4. Pares en red local, dos equipos — 3:00 a 3:40

Grabar las dos pantallas: la app en la primera laptop y la terminal del radar en la segunda (grabación de pantalla en la segunda, o la cámara del teléfono apuntando a la terminal). Clics: analizar de nuevo «SMS: «cuenta bloqueada»» → el teléfono avisa que otro cliente ya reportó esa dirección y arriba dice «Pares: 1» → «Reportar este mensaje» → en la segunda laptop el radar imprime el indicador recibido → pestaña «Radar del banco». Rótulo: «Prueba en red local · dos equipos · Hyperswarm, modo directo por TCP».

> Prueba en red local con dos equipos. En la segunda laptop corre el radar del banco. El transporte es Hyperswarm, el enjambre de Pear; como la red del lugar bloquea el DHT, usamos el modo directo por TCP. Si otro cliente ya reportó ese dominio, el teléfono lo avisa antes del veredicto. Al reportar, el teléfono envía solo un indicador: el tipo y un hash del dominio, nunca el mensaje ni el número del cliente. El radar lo recibe y lo marca para investigar. Son reportes no verificados y seudónimos; no bloquean nada automáticamente.

### 5. Hardware, QVAC y resultados — 3:40 a 4:30

Pantalla: «Acerca de este Mac» (chip y memoria) → README en GitHub, sección de modelos y hardware → tabla de métricas → `eval/runs/<fecha>/manifest.json`. Rótulo: «Datos sintéticos generados por el equipo · evaluación interna».

> Hardware real: este MacBook con Apple M4 y 16 gigas, sin GPU externa. Modelos, todos del catálogo de QVAC: VisionPsy de 460 millones de parámetros para leer capturas, Qwen3 4B para el veredicto, Parakeet para voz, EmbeddingGemma para la política y OCR latino como segunda lectura. Evaluación con 136 mensajes sintéticos que generamos nosotros: 80 fraudes y 56 legítimos o ambiguos. Resultado actual: 76 fraudes detectados y 4 en los que el motor se abstiene; ninguno mostrado como seguro. Legítimos, 53 de 56. Exactitud cercana al 95 por ciento. Es evaluación interna, no externa. Cada corrida deja un manifiesto reproducible en el repo, y las pruebas automáticas cubren los flujos con dobles de los modelos.

### 6. Otro sector, mismo motor, cierre — 4:30 a 4:55

Clics: tarjeta «WhatsApp: «soporte de billetera»» → veredicto (cortar la espera con rótulo). Rótulo final: enlace del repo.

> Mismas tácticas, otro sector: un «soporte» de billetera que pide la frase semilla. Mismo motor, veredicto: fraude. Sirve a bancos, cooperativas y billeteras de criptoactivos. Hoy es un prototipo Electron en Mac; la integración móvil viene después. Lo que gana el banco: revisión local de mensajes y llamadas, e indicadores de fraude en tiempo real, sin recibir jamás el mensaje del cliente. Repo, guía para probarlo y límites conocidos en el README.

## Reglas de honestidad

- No ocultar latencia: cada espera cortada lleva el rótulo «Corte: espera de N s».
- El audio de la llamada es sintético y se procesa por lotes; no afirmar captura de llamadas reales de WhatsApp ni telefónicas.
- Los reportes entre pares no están verificados, los hashes son seudónimos y no hay bloqueo automático. No afirmar usuarios únicos.
- Los datos son sintéticos y la evaluación es interna. Decir falsos negativos y abstenciones, no solo precisión.
- Ninguna credencial ni dato personal en pantalla. El video no sustituye las pruebas: el jurado puede reproducir todo con [COMO-PROBAR.md](COMO-PROBAR.md).

## Después de grabar

1. Montar en iMovie, exportar a 1080p, revisar que dure menos de 5:00.
2. Subir a YouTube como «no listado» y abrir el enlace en incógnito.
3. Pegar el enlace en Dojo, en el README y en [ENTREGA.md](ENTREGA.md).
