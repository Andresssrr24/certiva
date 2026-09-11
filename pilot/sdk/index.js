// Pure JavaScript: no network, storage, Node APIs or generative decisions.
// Runs unchanged in browsers and JavaScriptCore inside the native SDK.
const rules = require("../../lib/reglas");
const VERSION = "0.1.0";
const CHANNELS = ["sms", "whatsapp", "correo", "otro"];
const SOURCES = ["texto", "apple_vision"];
const REASONS = Object.freeze({
  pide_datos_sensibles: "Solicita una clave o un código privado",
  dominio_parecido: "El enlace se parece al del banco",
  dominio_no_oficial: "El enlace no está en el registro de referencia",
  numero_no_oficial: "El teléfono no está en el registro de referencia",
  acortador: "El enlace oculta su destino",
  ip_literal: "El enlace utiliza una dirección IP",
  punycode: "El dominio necesita una revisión adicional",
  pago_terceros: "Solicita un pago a un tercero",
  urgencia: "El mensaje presiona para actuar pronto",
  envio_para_recibir: "Solicita enviar dinero para recibir un beneficio",
  cambio_direccion: "Solicita usar una dirección de pago nueva",
  lectura_incompleta: "El contenido es insuficiente o la lectura no se confirmó",
  politica_vencida: "La configuración necesita actualizarse",
});
const LABELS = {
  riesgo: "Encontramos señales de riesgo",
  revisar: "Conviene revisar este mensaje",
  sin_senales: "No encontramos señales en este contenido",
  no_concluyente: "No pudimos verificarlo",
};
const ACTIONS = {
  riesgo:
    "No compartas claves ni códigos ni sigas instrucciones de pago. Verifica con el banco desde su app o el número de tu tarjeta.",
  revisar: "Confirma la solicitud con el banco desde su app o el número de tu tarjeta antes de actuar.",
  sin_senales: "Esto no confirma que el mensaje sea auténtico. Nunca compartas claves ni códigos con otra persona.",
  no_concluyente:
    "Revisa el contenido y vuelve a intentarlo. Si tienes dudas, contacta al banco desde su app o el número de tu tarjeta.",
};
function isUUID(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}
function validatePolicy(policy) {
  if (
    !policy ||
    policy.schema !== 1 ||
    typeof policy.version !== "string" ||
    !Number.isFinite(Date.parse(policy.expiresAt)) ||
    !Number.isFinite(Date.parse(policy.issuedAt)) ||
    !policy.bank ||
    !Array.isArray(policy.bank.dominios_oficiales) ||
    !policy.bank.dominios_oficiales.length ||
    !policy.bank.dominios_oficiales.every((d) => typeof d === "string" && /^[a-z0-9.-]{1,253}$/.test(d)) ||
    !Array.isArray(policy.bank.telefonos_oficiales) ||
    !Array.isArray(policy.bank.acortadores)
  ) {
    throw new Error("Configuración inválida");
  }
}
function extract(text) {
  const enlaces = (
    text.match(
      /(?:https?:\/\/|www\.)[^\s<>"'«»]+|\b[a-z0-9][a-z0-9.-]*\.(?:com|pa|net|org|app|info|link|ly|io|co)\b(?:\/[^\s<>"']*)?/gi,
    ) || []
  ).map((value) => value.replace(/[.,;:!?)]*$/, ""));
  return {
    texto: text,
    remitente: "",
    enlaces: [...new Set(enlaces)],
    telefonos: text.match(/(?:\+?507[ -]?)?\b\d{3,4}[ -]\d{4}\b/g) || [],
    montos: text.match(/(?:USD|B\/\.?|\$)\s*\d[\d.,]*/g) || [],
  };
}
function assess(input, policy) {
  validatePolicy(policy);
  if (
    !input ||
    typeof input.text !== "string" ||
    input.text.length > 12000 ||
    !isUUID(input.id) ||
    !CHANNELS.includes(input.channel) ||
    !SOURCES.includes(input.source)
  ) {
    throw new Error("Entrada inválida: revisa el texto, canal e identificador");
  }
  const now = input.now === undefined ? Date.now() : input.now;
  if (!Number.isFinite(now)) throw new Error("Fecha inválida");
  const text = input.text.trim();
  let codes = [];
  let outcome;
  if (now >= Date.parse(policy.expiresAt) || now < Date.parse(policy.issuedAt) - 300000) {
    codes = ["politica_vencida"];
    outcome = "no_concluyente";
  } else if (
    text.length < 12 ||
    !/[a-záéíóúñ]{3}/i.test(text) ||
    (input.source === "apple_vision" && input.readingConfirmed !== true)
  ) {
    codes = ["lectura_incompleta"];
    outcome = "no_concluyente";
  } else {
    // Preserve conservative rules but remove the exact match that ignores negations.
    codes = [
      ...new Set(
        rules
          .evaluar(extract(text), policy.bank)
          .filter((item) => item.tipo !== "pide_datos_sensibles" || rules.pideDatosDifuso(text))
          .filter((item) => item.tipo !== "numero_no_oficial" || policy.bank.telefonos_oficiales.length > 0)
          .map((item) => item.tipo),
      ),
    ];
    const strong = codes.some((code) =>
      ["pide_datos_sensibles", "dominio_parecido", "pago_terceros", "envio_para_recibir", "cambio_direccion"].includes(
        code,
      ),
    );
    outcome = strong ? "riesgo" : codes.length ? "revisar" : "sin_senales";
  }
  return {
    id: input.id,
    outcome,
    title: LABELS[outcome],
    action: ACTIONS[outcome],
    reasons: codes.map((code) => ({ code, title: REASONS[code] })),
    channel: input.channel,
    source: input.source,
    evaluatedAt: new Date(now).toISOString(),
    policyVersion: policy.version,
    sdkVersion: VERSION,
    coverage: "reglas_de_texto",
  };
}
// This projection deliberately cannot contain the message, numbers, URL or image.
function makeReport(assessment) {
  return {
    assessmentId: assessment.id,
    outcome: assessment.outcome,
    reasonCodes: assessment.reasons.map((reason) => reason.code),
    channel: assessment.channel,
    source: assessment.source,
    evaluatedAt: assessment.evaluatedAt,
    policyVersion: assessment.policyVersion,
    sdkVersion: VERSION,
    consent: true,
  };
}
module.exports = { assess, makeReport, validatePolicy, VERSION, CHANNELS, SOURCES, REASONS, LABELS, isUUID };
