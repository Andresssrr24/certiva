// Contrato entre los tres roles. La gramática del SDK obliga al modelo a respetar estos esquemas,
// así que el resto del código puede confiar en la forma. Cambiarlos exige avisar al grupo.
"use strict";

const ESQUEMA_CAPTURA = {
  type: "object",
  additionalProperties: false,
  required: ["canal", "remitente", "texto", "enlaces", "telefonos", "montos", "pide_datos_sensibles", "urgencia"],
  properties: {
    canal: { type: "string", enum: ["sms", "whatsapp", "correo", "otro"] },
    remitente: { type: "string" },
    texto: { type: "string" },
    enlaces: { type: "array", items: { type: "string" } },
    telefonos: { type: "array", items: { type: "string" } },
    montos: { type: "array", items: { type: "string" } },
    pide_datos_sensibles: { type: "boolean" },
    urgencia: { type: "boolean" },
  },
};

// El modelo NO repite las evidencias de las reglas: la app las une. Así la salida es corta y el veredicto tarda la mitad.
const ESQUEMA_VEREDICTO = {
  type: "object",
  additionalProperties: false,
  required: ["veredicto", "confianza", "senal_adicional", "accion", "canal_oficial"],
  properties: {
    veredicto: { type: "string", enum: ["fraude", "sospechoso", "sin_senales", "no_legible"] },
    confianza: { type: "number", minimum: 0, maximum: 1 },
    senal_adicional: {
      type: "object",
      additionalProperties: false,
      required: ["tipo", "evidencia"],
      properties: { tipo: { type: "string" }, evidencia: { type: "string" } },
    },
    accion: { type: "string" },
    canal_oficial: { type: "string" },
  },
};

// Resumen de una llamada al terminar: veredicto corto para el cliente.
const ESQUEMA_LLAMADA = {
  type: "object",
  additionalProperties: false,
  required: ["veredicto", "resumen", "accion"],
  properties: {
    veredicto: { type: "string", enum: ["fraude", "sospechoso", "sin_senales"] },
    resumen: { type: "string" },
    accion: { type: "string" },
  },
};

function promptLlamada({ transcripcion, alertas, banco, politica }) {
  const sistema = [
    `Eres el verificador anti-fraude de ${banco.nombre}. Acabas de escuchar una llamada que recibió un cliente.`,
    "Regla de oro: el banco nunca llama para pedir el código que llegó por SMS, ni la clave, ni el PIN. Quien lo pide es un estafador, aunque se presente con nombre y departamento.",
    "Resume la llamada en dos frases para una persona mayor y dile qué hacer en una o dos frases. Español claro.",
    "/no_think",
  ].join(" ");
  const usuario = [
    "Transcripción:",
    transcripcion,
    "",
    "Alertas detectadas por reglas:",
    JSON.stringify(alertas),
    ...(politica && politica.length
      ? ["", "Política oficial del banco para este caso:", ...politica.map((p) => `- ${p}`)]
      : []),
    "",
    "Devuelve el JSON pedido.",
  ].join("\n");
  return [
    { role: "system", content: sistema },
    { role: "user", content: usuario },
  ];
}

// Prompt para el modelo de visión. Lee la captura tal cual, sin juzgar.
const PROMPT_CAPTURA = [
  "Esta es la captura de pantalla de un mensaje recibido en un teléfono.",
  "Transcribe el mensaje tal como aparece, sin corregir ni resumir.",
  "Indica el canal: sms, whatsapp, correo u otro.",
  "Copia el remitente exactamente como se muestra (número, nombre o dirección de correo).",
  "Lista todos los enlaces tal como aparecen escritos, aunque estén incompletos.",
  "Lista todos los números de teléfono que aparecen en el texto.",
  "Lista los montos de dinero que aparecen.",
  "pide_datos_sensibles es true solo si el mensaje pide al usuario que envíe, responda, confirme o comparta una clave, contraseña, PIN, código de verificación, token o datos de tarjeta.",
  "urgencia es true si el mensaje presiona con plazos, bloqueos, suspensiones o amenazas.",
  "Responde únicamente con el JSON pedido.",
].join(" ");

// Prompt de transcripción libre para VisionPsy. Es lo que el modelo hace bien; los campos salen por reglas.
const PROMPT_TRANSCRIBIR =
  "Transcribe exactly all the text visible in this phone screenshot, in the original language, one line per visual line. Output only the transcription.";

// Prompt para el modelo de texto. Recibe la extracción y las evidencias de las reglas.
function promptVeredicto({ captura, senales, banco, base, politica }) {
  const sistema = [
    `Eres el verificador anti-fraude de ${banco.nombre}. Analizas mensajes que un cliente recibió y decides si son fraude.`,
    "Regla de oro: nunca digas que un mensaje es seguro. Si no hay señales, di que no encontraste señales y recuerda que el banco nunca pide claves ni códigos.",
    `Canales oficiales del banco: dominios ${banco.dominios_oficiales.join(", ")}; teléfonos ${banco.telefonos_oficiales.join(", ")}.`,
    "Un mensaje que dice venir del banco y usa un dominio o teléfono que no es oficial es fraude.",
    "Un mensaje que pide clave, PIN, código de verificación o datos de tarjeta es fraude, incluso si parece del banco.",
    "Un mensaje que solo informa una transacción o envía un código sin pedir nada a cambio no tiene señales.",
    "Presión de tiempo sin otra señal es sospechoso, no fraude. Si el texto mete prisa (último aviso, vence hoy, será suspendida, hoy mismo) y no hay otra señal, el veredicto es sospechoso aunque las reglas digan sin_senales, y pon esa frase como senal_adicional de tipo urgencia.",
    "Usa no_legible solo si el texto está vacío o es incomprensible. Si el texto se entiende y no hay señales, el veredicto es sin_senales.",
    "Parte del veredicto base que te dan las reglas y cámbialo solo con una razón concreta.",
    'No repitas las evidencias de las reglas. En senal_adicional pon como máximo una señal que las reglas no vieron, con la frase exacta del mensaje como evidencia; si no hay ninguna, pon tipo "ninguna" y evidencia vacía.',
    "Escribe en español claro, para una persona mayor. La acción tiene como máximo dos frases cortas: qué hacer y qué no hacer.",
    "El campo canal_oficial es una sola frase con el teléfono o el sitio oficial que aplica.",
    "/no_think",
  ].join(" ");
  const usuario = [
    "Mensaje extraído de la captura:",
    JSON.stringify(captura),
    "",
    "Evidencias encontradas por reglas deterministas (pueden estar vacías):",
    JSON.stringify(senales),
    "",
    `Veredicto base según las reglas: ${base || "sin_senales"}.`,
    ...(politica && politica.length
      ? [
          "",
          "Política oficial del banco, recuperada para este caso. Úsala para la acción y el canal oficial:",
          ...politica.map((p) => `- ${p}`),
        ]
      : []),
    "",
    "Devuelve el veredicto en el JSON pedido.",
  ].join("\n");
  return [
    { role: "system", content: sistema },
    { role: "user", content: usuario },
  ];
}

module.exports = {
  ESQUEMA_CAPTURA,
  ESQUEMA_VEREDICTO,
  ESQUEMA_LLAMADA,
  PROMPT_CAPTURA,
  PROMPT_TRANSCRIBIR,
  promptVeredicto,
  promptLlamada,
};
