export const REPORT_KEYS = [
  "assessmentId",
  "outcome",
  "reasonCodes",
  "channel",
  "source",
  "evaluatedAt",
  "policyVersion",
  "sdkVersion",
  "consent",
].sort();
export const REASONS = [
  "pide_datos_sensibles",
  "dominio_parecido",
  "dominio_no_oficial",
  "numero_no_oficial",
  "acortador",
  "ip_literal",
  "punycode",
  "pago_terceros",
  "urgencia",
  "envio_para_recibir",
  "cambio_direccion",
  "lectura_incompleta",
  "politica_vencida",
];
export function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  error.public = true;
  throw error;
}
export function validateReport(data, now) {
  if (JSON.stringify(Object.keys(data).sort()) !== JSON.stringify(REPORT_KEYS))
    fail(400, "Solo se admiten los campos mínimos del reporte");
  const engine =
    (["texto", "apple_vision"].includes(data.source) && data.sdkVersion === "0.1.0") ||
    (data.source === "qvac_texto" && data.sdkVersion === "0.3.0-qvac");
  if (
    typeof data.assessmentId !== "string" ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(data.assessmentId) ||
    data.consent !== true ||
    !["riesgo", "revisar", "sin_senales", "no_concluyente"].includes(data.outcome) ||
    !["sms", "whatsapp", "correo", "otro"].includes(data.channel) ||
    !engine ||
    data.policyVersion !== "ca-referencia-2026-09-v1" ||
    !Array.isArray(data.reasonCodes) ||
    data.reasonCodes.length > REASONS.length ||
    data.reasonCodes.some((code) => !REASONS.includes(code)) ||
    new Set(data.reasonCodes).size !== data.reasonCodes.length ||
    typeof data.evaluatedAt !== "string" ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(data.evaluatedAt) ||
    !Number.isFinite(Date.parse(data.evaluatedAt)) ||
    Date.parse(data.evaluatedAt) > now + 300000 ||
    Date.parse(data.evaluatedAt) < now - 86400000
  )
    fail(400, "Reporte inválido o vencido. Vuelve a verificar el mensaje");
  const codes = data.reasonCodes;
  const strong = [
    "pide_datos_sensibles",
    "dominio_parecido",
    "pago_terceros",
    "envio_para_recibir",
    "cambio_direccion",
  ];
  const expected = codes.some((code) => ["politica_vencida", "lectura_incompleta"].includes(code))
    ? "no_concluyente"
    : codes.some((code) => strong.includes(code))
      ? "riesgo"
      : codes.length
        ? "revisar"
        : "sin_senales";
  if (data.outcome !== expected) fail(400, "El resultado no coincide con sus motivos");
  return Object.fromEntries(REPORT_KEYS.map((key) => [key, data[key]]));
}
