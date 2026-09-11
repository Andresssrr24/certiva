"use strict";
// Texto ya recibido: conservarlo literalmente, sin OCR ni reparaciones de enlaces.
const { RE_PIDE_PUBLICA, RE_URGENCIA_PUBLICA, RE_URGENCIA_DIFUSA, pideDatosDifuso, normaliza } = require("./reglas");
function entradaTexto(mensaje) {
  if (
    !mensaje ||
    typeof mensaje.texto !== "string" ||
    mensaje.texto.length > 12000 ||
    !["sms", "whatsapp", "correo", "otro"].includes(mensaje.canal) ||
    (mensaje.remitente !== undefined && (typeof mensaje.remitente !== "string" || mensaje.remitente.length > 256))
  )
    throw new Error("Mensaje inválido: revisa canal, remitente y longitud (máximo 12000 caracteres)");
  const inicio = Date.now(),
    texto = mensaje.texto;
  const enlaces = [
    ...new Set(
      (
        texto.match(
          /(?:https?:\/\/|www\.)[^\s<>"'«»,;]+|\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:com|net|org|app|info|co|pa|link|ly|gd|gy|io|es|me)\b(?:\/[^\s<>"'«»,;]*)?/gi,
        ) || []
      ).map((x) => x.replace(/[.,;:)]+$/, "")),
    ),
  ];
  const telefonos = [
    ...new Set(
      texto.match(/(?:\+?507[\s-]?)?\b\d{3,4}[\s-]\d{4}\b|\+1\s?\(\d{3}\)\s?\d{3}-\d{4}|\b800-\d{4}\b/g) || [],
    ),
  ];
  return {
    captura: {
      canal: mensaje.canal,
      remitente: mensaje.remitente || "",
      texto,
      enlaces,
      telefonos,
      montos: [...new Set(texto.match(/(?:B\/\.?|USD|\$)\s?\d[\d.,]*/g) || [])],
      pide_datos_sensibles: RE_PIDE_PUBLICA.test(texto) || !!pideDatosDifuso(texto),
      urgencia: RE_URGENCIA_PUBLICA.test(texto) || RE_URGENCIA_DIFUSA.test(normaliza(texto)),
    },
    ms: Date.now() - inicio,
    ttft: null,
    modelo: "Texto recibido · sin OCR",
    crudo: texto,
  };
}
module.exports = { entradaTexto };
