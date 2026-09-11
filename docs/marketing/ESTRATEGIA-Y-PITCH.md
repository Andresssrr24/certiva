# Marketing del proyecto — propuesta para decidir

Estado: propuesta editorial. Nombre pendiente de aprobación. No se han comprobado marcas, dominios ni disponibilidad comercial. Este documento describe el prototipo conocido y separa las capacidades actuales de la propuesta futura.

## La idea que queremos que recuerden

Antes de compartir un código, verifica el mensaje.

El producto ayuda a una persona a revisar un mensaje sospechoso, entender las señales y elegir un siguiente paso. La ejecución local es la razón para confiarle esa revisión sin enviar la captura a una API de IA.

## Opciones de nombre

| Nombre provisional | Frase | Ventaja | Consideración |
|---|---|---|---|
| Pausa | Antes de responder, verifica. | Habla de una acción sencilla y recordable. | Palabra común; necesita descriptor y revisión de disponibilidad. |
| Avisa | Una señal a tiempo. | Cercano y orientado a ayudar. | Puede percibirse como una app de notificaciones. |
| Umbral | Verifica antes de dar el siguiente paso. | Encaja con prevención antes de actuar. | Más abstracto para público general. |

Recomendación creativa: **Pausa · Verificador de mensajes con IA local**. Usar Pausa como nombre de trabajo hasta que el equipo decida. QVAC debe aparecer como tecnología y evidencia, sin sugerir que Tether certifica o respalda comercialmente el producto.

## Posicionamiento

Para clientes que reciben mensajes que parecen venir de su banco, Pausa es un asistente de verificación que identifica señales de engaño y propone una acción clara. El prototipo analiza capturas localmente con QVAC; la integración en aplicaciones bancarias es el siguiente paso propuesto.

No presentar el proyecto como antivirus, certificador de mensajes auténticos, detector infalible o solución ya desplegada en móviles.

## Tres mensajes, según quién escucha

**Cliente:** «¿Este mensaje será de mi banco? Revísalo antes de responder.»

**Banco:** «Ayude a sus clientes a reconocer señales de engaño antes de actuar, con análisis local y reportes de indicadores para revisión.»

**Jurado:** «Un flujo completo con VisionPsy como lector central: captura, señales, contraste local cuando hace falta, explicación y acción. Mostramos cuándo funciona y cuándo debe pedir revisión.»

## Pitch de 30 segundos

«Te llega un mensaje: parece de tu banco y te pide un código. Antes de responder, necesitas una manera sencilla de revisar qué está pasando. Estamos construyendo Pausa: analiza una captura con IA local, explica las señales sospechosas y te orienta sobre qué hacer. El prototipo funciona en Mac con QVAC y VisionPsy. Nuestra propuesta es llevar esa verificación a la aplicación del banco, con una experiencia clara y sin enviar la captura a una API de IA.»

## Pitch de 90 segundos

«Imagina que recibes un mensaje con el nombre de tu banco: “Necesitamos el código que acaba de llegarte”. Estás ocupado, el mensaje parece urgente y tienes que decidir si responder.

Pausa ayuda en ese momento. El usuario aporta una captura y el prototipo la lee con VisionPsy, busca señales de engaño y explica el siguiente paso. Cuando la lectura no es concluyente, pide revisión. No convierte la ausencia de señales en una garantía de seguridad.

La inferencia se ejecuta localmente con QVAC. Eso permite demostrar el análisis sin internet después de descargar los modelos. También mostramos una simulación de vishing con audio sintético y un intercambio de indicadores entre pares; los reportes quedan pendientes de investigación, no se convierten automáticamente en fraude confirmado.

Hoy tenemos un prototipo de escritorio y evaluación sobre datos sintéticos. El siguiente paso es validar con el banco los casos de uso, medir errores y tiempos con ejemplos nuevos, y estudiar la integración móvil. Buscamos un equipo de innovación y prevención de fraude con quien diseñar esa validación.»

## Texto para la ficha del hackathon

**Título:** Pausa — verifica antes de responder.

**Descripción corta:** Asistente antifraude con IA local que analiza capturas de mensajes, explica señales sospechosas y orienta al usuario antes de actuar.

**Descripción ampliada:** Prototipo Electron que combina VisionPsy, reglas y generación local con QVAC para revisar mensajes bancarios sospechosos. Incorpora contraste OCR para resultados sin señales y una salida de revisión ante discrepancias. Incluye una simulación de análisis de llamadas y reportes de indicadores entre pares. El proyecto apunta a General, Caja de Ahorros y QVAC Psy. La integración móvil y bancaria son siguientes etapas; la precisión de los cambios recientes está pendiente de evaluación real.

## Copy para una futura portada

**Antetítulo:** Verificación de mensajes con IA local.

**Titular:** Antes de compartir un código, verifica el mensaje.

**Subtítulo:** Revisa una captura, entiende las señales sospechosas y encuentra un siguiente paso. Con análisis local mediante QVAC.

**CTA principal:** Ver demostración.

**CTA secundario:** Explorar una validación con tu banco.

**Nota visible:** Prototipo de escritorio. Puede cometer errores; no certifica que un mensaje sea auténtico.

**Tres bloques:**

- Revisa: aporta una captura del mensaje que te genera dudas.
- Entiende: recibe una explicación de las señales detectadas.
- Decide con cautela: consulta al banco por un canal oficial si la lectura no es concluyente.

No usar «Descargar app» o «Activar protección» hasta que exista una distribución funcional apropiada.

## Historia visual de la demo

1. Mensaje sintético que pide un código; incluir rótulo de simulación.
2. Captura cargada y análisis local real, mostrando el tiempo transcurrido.
3. Explicación y acción en lenguaje sencillo.
4. Caso ambiguo: la aplicación pide revisión.
5. Reporte recibido por otro equipo y marcado para investigar.
6. Cierre con hardware, evidencia medida y siguiente paso.

Dirección visual propuesta: tipografía legible, una acción principal por pantalla y contraste claro. Reservar rojo para alertas concretas. La ausencia de señales debe usar un estado neutro, sin escudo verde ni marca de verificación que sugiera autenticidad. Evitar candados que prometan anonimato absoluto.

## Evidencia y afirmaciones

| Afirmación | Forma adecuada de comunicarla |
|---|---|
| Precisión | «La versión anterior obtuvo 98,3% en 120 capturas sintéticas de desarrollo; no equivale a precisión en usuarios reales.» Repetir antes de atribuir resultados a la rama nueva. |
| Funciona offline | Demostrar una captura nueva con modelos descargados e internet desconectado. P2P se demuestra aparte con conectividad entre equipos. |
| Privacidad | «La inferencia es local; los reportes compartidos contienen hashes y metadatos.» Los hashes son seudónimos, no anonimización. |
| Móvil | «Prototipo de interfaz móvil ejecutado en escritorio; integración móvil propuesta.» |
| Llamadas | «Simulación con audio sintético procesado por lotes.» |
| Ahorro | «Evita una tarifa de API de inferencia por consulta.» No equivale a costo operativo cero ni ahorro bancario medido. |
| Fraude evitado | No afirmar pérdidas evitadas ni reducción porcentual: aún no existe evidencia de piloto. |
| Relación con Caja | «Propuesta para el desafío de Caja de Ahorros.» No «cliente», «socio» ni «avalado» sin acuerdo. |

## Oferta para la conversación con el banco

Proponer una sesión de validación con innovación, prevención de fraude y experiencia de cliente. El objetivo es seleccionar casos representativos y definir un experimento antes de comprometer una integración productiva.

Entregables propuestos de esa validación: conjunto sintético acordado, medición de errores y latencia, observación de si las personas entienden el consejo, y decisión de viabilidad móvil. No prometer un piloto en producción en 90 días antes de conocer sus requisitos.

Preguntas de descubrimiento: ¿qué mensajes generan más consultas? ¿Qué puede mostrar el producto sin crear falsa tranquilidad? ¿Qué necesita un analista para investigar un indicador? ¿En qué dispositivos tendría que funcionar?

## Orden de producción de materiales

1. Decidir nombre y frase principal.
2. Ajustar ficha del hackathon y apertura/cierre del video a ese mensaje.
3. Capturar evidencia real de la versión que se entregará.
4. Preparar una lámina comercial con problema, demo, evidencia y solicitud al banco.
5. Crear una landing o piezas sociales cuando estén definidos nombre y demo pública.

Prioridad para el hackathon: que el jurado entienda el beneficio y vea evidencia. La identidad visual acompaña esa historia.
