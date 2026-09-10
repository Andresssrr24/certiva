# Propósito e integración en el ecosistema bancario

Documento para el equipo y para la conversación con el jurado de la Caja de Ahorros. Responde a una pregunta que va a salir: la app funciona, ¿pero para qué se integra con un banco, con un sistema de pagos o con la facturación?

## El propósito en una frase

Hoy los controles antifraude del banco actúan sobre la transacción, cuando el cliente ya fue engañado. Esta pieza actúa sobre el engaño, antes de la transacción, en el único lugar donde ocurre: el teléfono del cliente. Y como corre ahí, el banco recibe la señal sin recibir el mensaje.

## La brecha que cubre

El monitoreo transaccional ve que un jubilado transfiere a una cuenta nueva. No ve que hace tres minutos alguien lo llamó diciendo ser del banco y le pidió el código. Nadie en el ecosistema está en el teléfono del cliente cuando lo manipulan: ni el banco, ni el procesador de pagos, ni la operadora. Esa es la capa nueva.

## Dónde encaja

| Punto de integración | Qué aporta | Qué viaja |
|---|---|---|
| **App de banca móvil** | «Verificar un mensaje» y «Verificar una llamada» como función nativa, con la distribución que ya tiene el banco. | Nada: el análisis es local. |
| **Flujo de pagos** | Fricción selectiva. Si el cliente verificó un fraude o colgó una llamada sospechosa y en los minutos siguientes agrega un beneficiario o transfiere a un tercero nuevo, el pago pasa a espera, a verificación por llamada o a límite reducido. Hoy esa fricción se aplica a todos o a nadie. | Una bandera de coacción reciente con marca de tiempo, sin contenido. |
| **Registro de canales oficiales** | El banco mantiene la lista de sus remitentes, dominios y números, y la app la consume. «No está en la lista» deja de ser una heurística y pasa a ser un hecho. | La lista, del banco al teléfono. |
| **Equipo de fraude y SIEM** | El radar de indicadores alimenta bloqueos en la pasarela de SMS, solicitudes de baja de dominios, alertas al centro de llamadas y, por pares, a otros bancos vía la Asociación Bancaria. | Hashes de remitente, número y dominio. |
| **Facturación y cobranza** | Los emisores legítimos, el propio banco, utilities, registran cómo cobran y cómo no: «nunca por Yappy a un número personal». Un recordatorio real pasa la verificación; uno falso, no. | El registro del emisor. |
| **Regulador** | La SBP pide trazabilidad de incidentes de fraude digital. El radar produce estadística agregada de campañas por semana y por canal sin un solo mensaje de cliente. | Agregados anónimos. |
| **Educación e inclusión** | Cada veredicto es una lección personalizada en el momento en que importa, no un folleto. | Nada. |

## El caso de pagos

La integración no es que la app «apruebe» pagos. Es que le da al motor de riesgo del banco una señal que hoy no tiene: el contexto de manipulación. Muchos bancos ya aplican enfriamiento para beneficiarios nuevos; esto permite aplicarlo solo cuando hay razón, que es menos fricción para el cliente honesto y más para el que está siendo coaccionado. La señal es un booleano con marca de tiempo, no un mensaje, así que cabe en cualquier motor de reglas sin tocar datos personales.

Secuencia tipo:

1. El cliente recibe la llamada. El modo llamada detecta «dígame el código» y muestra «Cuelga».
2. La app registra localmente una ventana de coacción de, por ejemplo, treinta minutos.
3. Si en esa ventana el cliente intenta una transferencia a un beneficiario nuevo, la app de banca envía al banco la bandera junto con la transacción.
4. El motor de riesgo aplica su política: espera, verificación por llamada saliente al número registrado, o límite reducido.
5. Nada del contenido de la llamada sale del teléfono. El banco solo sabe que hubo coacción reciente.

## Por qué dentro del banco y no como app suelta

Apps de detección de phishing existen. Lo que ninguna tiene es lo que solo el banco puede poner: la distribución en una app que el cliente ya usa, la confianza de la marca que está siendo suplantada, el registro de canales oficiales, y la conexión con el flujo de pagos para actuar. Lo que hace posible meterlo dentro de una app regulada es que corre local: el banco no se vuelve custodio de los mensajes privados de sus clientes, que es un problema legal y reputacional que ningún banco quiere.

## Límites, dichos antes de que los digan

- No detiene estafas que no imitan al banco: románticas, de inversión, de empleo.
- Necesita que el cliente lo use, o que el banco lo dispare por contexto. Para el segmento mayor eso exige onboarding en sucursal.
- Complementa el control transaccional; no lo reemplaza. Es una capa nueva en el tramo donde hoy no hay ninguna.
- La calidad depende del modelo de visión pequeño: sobre el set sintético, 98,3 % de exactitud con precisión del 100 % en fraude, y los fallos son mensajes con la frase clave mal transcrita.

## Integración mínima para un piloto

**Fase 1, noventa días.** El módulo dentro de la app del banco, el registro de canales oficiales alimentado por el banco, y el radar para el equipo de fraude. Tres indicadores: mensajes verificados, campañas detectadas antes que el centro de llamadas, y llamadas al centro evitadas.

**Fase 2.** La bandera de coacción conectada al motor de riesgo de pagos, cuando el piloto demuestre que la señal llega antes que la transferencia.

**Fase 3.** Radar compartido entre bancos vía la Asociación Bancaria, y versión de marca blanca para cooperativas y financieras.

## Lo que se vende y a quién

Un módulo que el banco embebe en su app, con una consola para el equipo de fraude que corre dentro de la infraestructura del banco, y una app de marca blanca para cooperativas y financieras, que en Panamá son cientos y no tienen presupuesto de seguridad. Lo local es el argumento económico: costo de inferencia cero por verificación, y ningún dato del cliente en manos de un proveedor. La propiedad intelectual queda en el equipo, como establece el reto de la Caja.
