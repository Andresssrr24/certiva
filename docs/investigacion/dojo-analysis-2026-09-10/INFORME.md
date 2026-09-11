# Posición competitiva · Decentralized AI Hackathon

Corte: 10 de septiembre de 2026, aproximadamente 21:27, Panamá. Investigación de Bryan. Proyecto propio: `antifraude-qvac`; «Pausa» es una propuesta de nombre, todavía no un nombre confirmado.

## Conclusión

Tenemos una candidatura técnicamente creíble y diferenciada para Caja de Ahorros. No hay evidencia para declararnos primeros ni asignar una probabilidad de ganar. DevCors y Chen son rivales bancarios sólidos; Ina Igar tiene evidencia móvil y un relato de inclusión atractivo. ClikToTrip destaca en preparación de entrega y hardware para Psy y el general. Nuestro mayor riesgo inmediato es entregar algo que el jurado pueda abrir y verificar: antifraude no aparece entre las 23 fichas públicas observadas, el enlace GitHub devuelve 404 sin credenciales y las métricas publicadas corresponden a una versión anterior.

**Prioridad recomendada: Caja de Ahorros → QVAC Psy → general.** Es una decisión estratégica, no una clasificación oficial. En banca el problema está bien delimitado y la demo puede expresar el beneficio en segundos. Psy es defendible por VisionPsy como lector central, licencia Apache-2.0 y medición; el escritorio M4 y la evaluación pendiente restan frente a evidencia móvil. En el general competimos con propuestas muy diferentes y no hemos reproducido todas sus demostraciones.

## Qué se revisó y qué significa

- Las **23 fichas públicas** de [Dojo](https://www.trydojo.io/hackathons/decentralized-ai-hackathon?tab=projects), incluidas sus inscripciones múltiples. El contador de participantes pasó de 286 a 287 durante la revisión.
- Los **14 repositorios enlazados**, leyendo documentación, estructura y rutas principales de código: 10 mediante clones superficiales y cuatro mediante archivos de GitHub cuando la clonación era demasiado pesada. No se ejecutaron aplicaciones ni suites de terceros. Esto es una revisión comparativa estática, no una auditoría exhaustiva de cada línea ni una certificación de funcionamiento.
- Los otros **9 proyectos no muestran repositorio en su ficha**. No se puede evaluar su código; esa ausencia no demuestra que no lo tengan.
- Nuestro código local en `c8a7e76`, resultados históricos y documentación de entrega. Ejecuté `npm test`: **8/8 pruebas pasan**, con dobles de modelos. No repetí inferencia, benchmarks ni la demo P2P.
- Releases verificadas mediante GitHub: ClikToTrip incluye APK, video y reportes; MAM incluye instalador Windows. No instalé estos binarios ni evalué visualmente todos los videos.
- Las métricas ajenas son resultados publicados por sus equipos, con archivos de apoyo cuando existen. No son resultados reproducidos por mí. Las tareas, datasets y dispositivos difieren: no cabe ordenar equipos comparando directamente sus porcentajes.

## Reglas que deciden la estrategia

El [texto oficial de los tracks](https://www.trydojo.io/hackathons/decentralized-ai-hackathon?tab=tracks) exige entrega **antes del 11 de septiembre a las 08:00, Panamá**, con repo accesible y video de máximo cinco minutos sin credenciales. El contador genérico de días de la interfaz no coincide con ese texto; usar el plazo explícito y mantener el margen interno de 07:00 de nuestro checklist.

General: técnica 35 %, innovación 25 %, impacto 20 %, diseño 10 %, completitud 10 %. El video es lo primero que revisa el jurado. QVAC es obligatorio; inferencia en API de nube descalifica. Pear/P2P suma, pero no es obligatorio. La base preexistente debe declararse.

Caja usa su propio criterio: aplicabilidad bancaria, ventaja de la ejecución local y calidad de demostración. Psy exige un modelo Psy central, hardware declarado, calidad medible, registro estructurado de rendimiento, código abierto con licencia permisiva y un flujo completo. No basta cambiar el nombre del modelo.

## Todos los proyectos

G = general; P = QVAC Psy; B = Caja; H = Philips; O = Ovnicom. Los tracks son los visibles en la ficha, no una conclusión de elegibilidad. «Sin track» significa que la ficha no lo muestra.

| Proyecto y fuente | Tracks | Evidencia encontrada / avance | Lectura competitiva |
|---|---|---|---|
| [Δ-FleetSense](https://github.com/alioth-stat/phillips-installed-base-intelligence) | H | FastAPI/React, cliente QVAC Python, extracción, voz, visión, SQLite, deduplicación y 16 tests declarados. Documenta Termux/Android; video pendiente. | Prototipo coherente. La afirmación de ejecución móvil necesita la evidencia de su demo; la deduplicación difusa y confianza heurística tienen límites. |
| [Narukami — Chen](https://github.com/pixeltabletop/Narukami---Hackathon) | B | QVAC en `server/qvac.ts`, voz local, SQLite, planificación y proyección deterministas; 12 archivos de tests. Documenta comparación de modelos y prueba offline. Video pendiente. | Rival bancario fuerte: flujo útil y control de cálculos. La IA está desactivada por defecto, pero `npm run demo` la activa; no es una simple maqueta. |
| [SAJA](https://github.com/jdb17-hub/SAJA_HACKATHON) | H, G | Streamlit, worker QVAC, SQLite, revisiones, recuentos, historial y filtros. Declara OCR y P2P no implementados. | Buen alcance funcional y tratamiento de inventario; la ficha promete móvil, el repo describe un entorno Windows. |
| [AEGIS](https://github.com/BLeandro5/AEGIS_AI) | H, P, G | MedPsy central vía SDK, FastAPI/React/SQLite, archivos de benchmarks y pruebas; baseline publicado de 8/8 casos sintéticos. Trabajo de preparación de fine-tuning. | Rival serio en Psy por modelo especializado y evidencia. Benchmark en i9/RTX 4070/32 GB: no demuestra rendimiento en teléfono. Preparar fine-tuning no demuestra un modelo mejorado. |
| [Jajanken-MAM](https://github.com/pixeltabletop/jajanken-hackathon) | H, P, G | Electron, Gemma4, Whisper, embeddings y validación de citas; instalador Windows público. Declara extracción 8/10. | Entrega tangible y reproducibilidad práctica. En el flujo documentado no aparece un modelo Psy: su inscripción en Psy no prueba elegibilidad. |
| [ClikToTrip](https://github.com/JVeraPTY/clik2trip-sovereign) | P, G | Android físico, VisionPsy, RAG, WDK testnet, APK firmado, video 2:30 y reportes en release pública. | De los más preparados para evaluación. Calidad/latencia del modelo débiles: 25 % categoría, 30 % Top-3, TTFT mediano 43,7 s; fuerte en entrega y evidencia móvil. |
| [Kuro](https://www.trydojo.io/hackathons/decentralized-ai-hackathon/project/kuro) | G | Ficha sobre conocimiento confidencial, QVAC y Pear; sin repo visible. | Potencial competencia P2P; avance técnico no verificable. |
| [Luma](https://github.com/george888-q/luma-Inteligencia-de-Base-Instalada-de-Clientes) | H, G | React, QVAC local por loopback, extracción/revisión, conflictos y exportación. Cuatro casos reales de inferencia publicados. | Producto enfocado. El dictado usa `SpeechRecognition` del navegador: no demuestra por sí mismo procesamiento local. El README tampoco certifica aislamiento de red. |
| [RACS Intelligence](https://www.trydojo.io/hackathons/decentralized-ai-hackathon/project/racs-intelligence) | P, G, O, B | Ficha de DNS, phishing, Wazuh y Grafana; sin repo visible. | El rival temático más cercano en seguridad bancaria, aunque protege infraestructura y nosotros al cliente. No se puede puntuar ejecución. |
| [Paridad](https://www.trydojo.io/hackathons/decentralized-ai-hackathon/project/paridad) | G | Propone comparación privada de precios desde facturas y P2P; sin repo visible. | Buen caso de descentralización; evidencia insuficiente para posicionarlo. |
| [TrustMesh AI](https://github.com/srbisnes/SRBISNES/tree/main/trustmesh-ai) | G | Subcarpeta propia con simulación determinista de bancos/agentes, SHA-256 y almacenamiento local. Runtime de modelos queda para producción. | Compite en narrativa antifraude, pero el código revisado no demuestra integración QVAC. No confundir el README genérico de la raíz con esta subcarpeta. |
| [DevCors](https://github.com/HernandoSilvaLeal/expediente-local) | B, G | MedPsy, campos anclados a citas, guardias, trazabilidad, revisión humana y 390 pruebas declaradas. Código P2P; video pendiente. | Uno de los rivales más sólidos en banca. Reconoce que la inferencia entre dos máquinas físicas no está medida y que OCR solo se probó con imagen sintética. |
| [Zarpe](https://github.com/Jast-2281/qvac-hackathon-panama) | G | QVAC clasifica y código calcula; confirmaciones para categorías; 3 archivos de tests. | Propuesta local concreta, alcance muy limitado: tres categorías verificadas y una hipótesis tributaria pendiente según su README. Video pendiente. |
| [Mosaic](https://www.trydojo.io/hackathons/decentralized-ai-hackathon/project/mosaic) | H | Ficha de inventario hospitalario; sin repo visible. | Avance técnico no verificable. |
| [PULSO](https://github.com/jlbjulio/PULSO) | P, G | Electron, integración SDK, MedPsy/TranslatePsy, voz, diarización, RAG, órdenes revisadas y scripts LoRA/evaluación. Enlace de demo en Drive. | Rival ambicioso y relevante para Psy. Cargar varios modelos, operar audio continuo y validar extracción clínica eleva el riesgo de demo. No verifiqué una mejora cuantificada del LoRA. |
| [MangoApp](https://www.trydojo.io/hackathons/decentralized-ai-hackathon/project/mangoapp) | G | Plataforma B2B enlazada; descripción dice que desarrollarán una capa QVAC. Sin repo visible. | Puede tener ventaja comercial; el producto previo no acredita integración QVAC para el hackatón. |
| [ProofAI](https://www.trydojo.io/hackathons/decentralized-ai-hackathon/project/proofai) | Sin track visible | Descripción de extracción local de observaciones; sin repo visible. | Evidencia insuficiente. |
| [Ina Igar](https://github.com/0xj4an/Hackathon-ISD-2026) | P, G, B | Expo/iPhone, MedPsy, OCR y nodo LAN; código de inferencia local y `/inferir`. Estado nocturno documenta lectura y crédito; video, exportación perf y tres ensayos pendientes. | Rival fuerte por inclusión y hardware físico. Reconoce fallos OCR de memoria, Xiaomi que aborta y demo HTTP sin Hyperswarm/delegate. |
| [ATLAS](https://github.com/jlbjulio/ATLAS) | H | Motor QVAC multimodal, evidencia, SQLite, cola de sincronización y módulo Expo Android incorporado el día 10. Enlace a carpeta de demo. | Alcance amplio y código móvil adicional; compite principalmente en Philips según la ficha. Código móvil no equivale a demo física verificada. |
| [Onby](https://www.trydojo.io/hackathons/decentralized-ai-hackathon/project/biociclo) | Sin track visible | Una frase sobre onboarding interno; sin repo visible. | No hay base pública suficiente para evaluar. |
| [v2s](https://www.trydojo.io/hackathons/decentralized-ai-hackathon/project/the-project) | H, P, G, B | «voice-to-spreadsheet»; sin repo visible. | Está inscrito en banca y Psy, pero la ficha no respalda un nivel técnico. |
| [Salus](https://github.com/Vortecsmaster/Salus) | G | Repo se presenta como ONVIA. React Native/Expo con persistencia y pruebas; `ServicesProvider` inyecta preparación, conversación y transcripción simuladas. | Tiene trabajo de producto, pero no demuestra la integración de IA obligatoria. README reconoce datos sin cifrar, pese a la descripción de perfil cifrado en Dojo. |
| [Perseus AI](https://www.trydojo.io/hackathons/decentralized-ai-hackathon/project/perseus-ai) | Sin track visible | Propone rescate, voz/visión, Bluetooth/Wi-Fi Direct y pagos testnet; sin repo visible. | Relato de impacto fuerte, ejecución no verificable. |

## Nuestra posición por dimensión

| Dimensión | Situación propia | Consecuencia |
|---|---|---|
| Problema e impacto | Verificar mensaje antes de entregar código; simulación de vishing y radar bancario. | Beneficio comprensible para usuario y banco. No hay aún piloto ni ahorro económico medido. |
| Técnica | VisionPsy → extracción/reglas → Qwen; RAG local; segunda lectura OCR; Hyperswarm y TCP de demo. | Más que una interfaz con respuestas simuladas. Diferenciación defendible si se ve funcionar. |
| Calidad | 118/120 históricos; dos fraudes recibieron `sin_senales`. Segunda lectura posterior sin reevaluación completa. | No presentar 98,3 % como precisión actual, externa o en producción. Los ocho tests prueban controles, no sensibilidad real. |
| Hardware | Mac M4 de 16 GB. | Válido como prototipo de escritorio; no demuestra la promesa móvil. ClikToTrip e Ina Igar tienen evidencia declarada en teléfonos. |
| P2P | Código transmite indicadores y reúne reportes; hashes e identificadores sin autenticidad fuerte. | Puede sumar innovación, pero no es inmunidad colectiva ni anonimización. Mostrar reportes para investigar, no fraude confirmado. |
| Rendimiento | Registro histórico reproducible; OCR adicional cambia tiempos. | Medir latencia total y abstenciones de la rama final. No limitar la demo al caso favorable. |
| Entrega | Nombre provisional, repo no accesible anónimamente, ficha propia no localizada. | Es el riesgo más urgente y corregible. Un 404 puede ser privado, movido o ausente; no acredita acceso del jurado. |

**Juicio:** estamos mejor respaldados técnicamente que las propuestas cuyo propio código mantiene la IA simulada. No se puede concluir que superamos a los nueve equipos sin repo visible. Frente a rivales sólidos, tenemos un problema estrecho y una demo potencialmente clara; nos faltan cierre público, evidencia actualizada y madurez móvil.

## Prioridades antes de entregar

1. **Cerrar acceso y envío:** nombre definitivo, una ficha propia, repo accesible, video ≤5 minutos sin login y comprobante de entrega. Para Psy, cumplir además apertura y licencia permisiva. Verificar desde sesión anónima. No cambié la visibilidad ni envié nada en esta revisión.
2. **Reevaluar el commit final:** mismo set sintético para continuidad y un conjunto nuevo separado; reportar falsos negativos, falsos positivos, abstenciones, latencia mediana/p95 y fallos. Incluir las dos peticiones de código que fallaron históricamente. No ocultar el costo del OCR.
3. **Grabar un recorrido corto:** mensaje engañoso → señal concreta → acción; ejemplo legítimo o dudoso → respuesta prudente; llamada identificada como simulación; reporte que llega a otro equipo → radar marcado para investigación. Enseñar inferencia sin internet y luego P2P con conectividad entre equipos, como pruebas distintas.
4. **Vender el caso bancario:** módulo propuesto para ayudar al cliente antes de actuar y reducir exposición de sus mensajes. La integración móvil y el piloto son siguientes etapas; no afirmar despliegue actual.
5. **Evitar ampliar alcance esta noche:** cerrar lo demostrado, conservar límites visibles y preparar arranque limpio. Añadir móvil, pagos o nuevas funciones sin evidencia puede perjudicar la demostración.

## Cómo van, con el tiempo disponible

Se observa actividad de publicación el 10 de septiembre y estados explícitos de entrega: ClikToTrip publicó release a las 16:36 de Panamá; MAM a las 18:14; Ina Igar todavía documenta pendientes nocturnos. Eso permite describir avance público, no velocidad real de desarrollo: es una fotografía de una sola sesión, sin una auditoría longitudinal de cada equipo.

Los repos locales y archivos descargados quedan en esta carpeta para revisar las fuentes. `repos-snapshot.json` conserva las referencias técnicas recolectadas. El censo puede cambiar antes del cierre; no hay ranking de jueces verificado en este informe.
