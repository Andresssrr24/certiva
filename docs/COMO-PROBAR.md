# Cómo correr y probar el proyecto en tu laptop

Guía para el equipo. Todo corre en la máquina: modelos, reglas, pares. No hay nube.

## Antes de empezar

- **Un solo proceso de QVAC a la vez.** La app y los scripts comparten un worker en `~/.qvac`. Si abres la app mientras corre un script, o al revés, el segundo se queda esperando para siempre sin error. Cierra uno antes de abrir el otro.
- **Máquina:** macOS con Apple Silicon (probado en M4 con 16 GB), Node 22.17 o más. En Windows o Linux con GPU Vulkan debería funcionar, pero no está probado.
- **Espacio:** unos 6 GB de modelos en `~/.qvac/models`.

## 1. Instalar, una vez y con internet

```bash
git clone https://github.com/Andresssrr24/certiva.git
cd certiva
npm install
node node_modules/electron/install.js   # solo si npm install no bajó el binario de Electron (pasa en redes lentas)
npx -y @qvac/cli doctor                  # GPU, memoria y disco
npm run modelos                          # descarga VisionPsy, Qwen3 4B, Parakeet y EmbeddingGemma
```

Si el registro P2P del SDK se cae a mitad de Qwen3 4B, baja el archivo por HTTP e impórtalo; el SDK valida el checksum:

```bash
curl -L -C - -o ~/.qvac/descargas/Qwen3-4B-Q4_K_M.gguf "https://huggingface.co/Qwen/Qwen3-4B-GGUF/resolve/main/Qwen3-4B-Q4_K_M.gguf"
node scripts/importar-modelo.js QWEN3_4B_INST_Q4_K_M ~/.qvac/descargas/Qwen3-4B-Q4_K_M.gguf
```

## 2. Generar los datos de la demo

```bash
npm run datos                  # 120 mensajes sintéticos y sus capturas en data/capturas/
node data/generar-llamada.js   # audio de la llamada de vishing con las voces del sistema (macOS)
```

Ningún dato real: banco ficticio, números y dominios inventados, voces sintéticas.

## 3. El motor sin interfaz

Sirve para ver cada pieza y sus tiempos en la terminal.

```bash
npm run prueba                            # una captura: VisionPsy → reglas → veredicto de Qwen3
node scripts/prueba-offline.js data/capturas/legitimo-otp_legitimo-01.png   # otra captura
node scripts/prueba-vision.js 8           # solo el lector, 8 capturas, con la verdad al lado
node scripts/prueba-llamada.js            # la llamada: lotes, avisos y resumen
node scripts/prueba-politica.js           # qué fragmentos de la política recupera el RAG
node eval/reglas-check.js                 # las reglas contra la verdad, sin modelos, en un segundo
npm run eval                              # las 120 capturas -> eval/results.md y eval/perf.jsonl (unos 18 min)
```

## 4. La app

Apaga el Wi-Fi para que la barra diga «TCP externo: 0» y abre:

```bash
npm start
```

**Pestaña «Experiencia del cliente».** A la izquierda, un teléfono Android simulado. A la derecha, las situaciones de prueba y, plegada, la evidencia técnica.

1. Toca una de las cinco tarjetas de «Prueba una situación»: al teléfono llega la notificación del mensaje (paso 01), Certiva lo revisa en segundo plano (paso 02) y al terminar aparece la notificación «Certiva · Protección» (paso 03). Puedes abrir el mensaje mientras tanto, como haría el cliente. Una captura propia, arrastrada o con «Elegir captura…», muestra el veredicto directo.
2. «Ver detalle» en la notificación: el veredicto, las razones en lenguaje llano, el consejo, «Cómo contactar a tu banco» y «Reportar este mensaje».
3. A la derecha, «Ver análisis y evidencia técnica»: tiempos por etapa, señales con su nombre técnico, lo que leyó el modelo y el JSON completo. La barra inferior resume los tiempos de la última corrida.
4. «Simular llamada de vishing»: el audio suena, la transcripción aparece sincronizada y el «Cuelga» ocupa el teléfono cuando el estafador pide el código.
5. «Reportar este mensaje»: guarda el hash en `reportes.json` de la app, lo publica a los pares y abre un caso en el Centro de seguridad.

**Pestaña «Centro de seguridad».** «Operaciones»: bandeja de incidentes con los casos reportados desde el teléfono y sus acciones, registradas en el piloto sin conexión al banco; «Generar caso de prueba» crea un caso simulado. «Inteligencia de red»: indicadores reportados, pares conectados y registro de la capa de pares.

## 5. Pares

**Tú solo, en dos terminales.** Un radar que además emite el dominio de la tarjeta «SMS: cuenta bloqueada»:

```bash
node scripts/radar.js --puerto 4411 --sin-swarm --emitir dominio:bancodemo-pa.app
```

Y la app conectada a él:

```bash
PARES_DIRECTO=127.0.0.1:4411 PARES_SWARM=0 npm start
```

Al analizar esa tarjeta, el teléfono dice «Otro cliente ya reportó esta dirección web». Si tocas «Reportar», el radar lo lista al instante.

**Dos laptops.** En la segunda, `node scripts/radar.js` a secas: se encuentran por el enjambre de Hyperswarm. Si la red del lugar bloquea el DHT, modo directo: en la segunda `node scripts/radar.js --puerto 4411 --sin-swarm`, y en la primera `PARES_DIRECTO=<ip de la segunda>:4411 npm start`.

## 6. Comprobar sin manos

La app analiza una captura al abrir y guarda una imagen de su ventana. Es lo que se usó para verificar cada pantalla.

```bash
DEMO_AUTO=fraude-bloqueo_enlace-01 DEMO_CAPTURA=/tmp/app.png DEMO_SALIR=1 DEMO_ESPERA_MS=26000 npx electron .
DEMO_LLAMADA=1 DEMO_CAPTURA=/tmp/llamada.png DEMO_SALIR=1 DEMO_ESPERA_MS=31000 npx electron .
```

## Variables útiles

| Variable | Efecto |
|---|---|
| `LECTOR=ocr` | Lee con el OCR clásico del SDK en vez de VisionPsy (lento, para comparar) |
| `LECTOR=visionpsy-esquema` | VisionPsy rellenando el esquema de ocho campos (inventa; solo para la comparación) |
| `SIN_RAG=1` | Apaga la política como contexto |
| `PARES=0` | Apaga la capa de pares |
| `PARES_SWARM=0` | Deja solo el modo directo |
| `PARES_PUERTO=4411` | La app también escucha en modo directo |
| `PARES_DIRECTO=host:puerto` | La app se conecta a un par directo |
| `PERF_LOG=ruta` | Dónde escribir el registro de rendimiento (por defecto `eval/perf.jsonl`) |

## Si algo falla

- **Se queda cargando un modelo para siempre:** hay otro proceso de QVAC abierto. Ciérralo.
- **«Unrecognized key … modelConfig»:** una versión distinta del SDK. Fija `@qvac/sdk` en 0.19.
- **CONTEXT_OVERFLOW en el veredicto:** el modelo de texto se cargó con poco contexto; el catálogo ya lo carga con 4.096 tokens.
- **Capturas cortadas por la derecha:** Electron guarda el zoom por origen; `data/render.js` lo fija en 1. Vuelve a correr `npm run datos`.
- **La app abre pero las tarjetas no aparecen:** falta `npm run datos`.
