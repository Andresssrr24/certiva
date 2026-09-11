// Derivación pura de campos a partir de líneas de texto, venga de VisionPsy, del OCR o de un texto pegado.
// Sin dependencias de Node: este módulo se comparte tal cual con la app móvil.
"use strict";

// Une líneas; si una línea termina en medio de un enlace, la siguiente se pega sin espacio.
function unir(ls) {
  let texto = "";
  for (const l of ls) {
    if (!texto) {
      texto = l;
      continue;
    }
    const enlaceAbierto = /(https?:\/\/|www\.)[^\s]*$/i.test(texto) && !/[.!?]$/.test(texto);
    const continuaEnlace = /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(\/\S*)?/i.test(l) || /^\/[^\s]*/.test(l);
    texto += enlaceAbierto && continuaEnlace ? l : " " + l;
  }
  return texto.replace(/\s+/g, " ").trim();
}
const RE_URL =
  /(?:https?:\/\/|www\.)[^\s<>"'«»,;]+|\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:com|net|org|app|info|co|pa|link|ly|gd|gy|io|es|me)\b(?:\/[^\s<>"'«»,;]*)?/gi;
const RE_TEL = /(?:\+?507[\s-]?)?\b\d{3,4}[\s-]\d{4}\b|\+1\s?\(\d{3}\)\s?\d{3}-\d{4}|\b800-\d{4}\b/g;
const RE_MONTO = /(?:B\/\.?|USD|\$)\s?\d[\d.,]*/g;
function canalDe(ls) {
  const t = ls.join(" \n ").toLowerCase();
  if (/para m[ií]|asunto|@[a-z0-9.-]+\.[a-z]{2,}>/.test(t) && !/mensaje de texto/.test(t)) return "correo";
  if (/no est[aá] en tus contactos|cuenta de empresa verificada|whatsapp|^mensaje$/m.test(t)) return "whatsapp";
  if (/mensaje de texto|imessage/.test(t)) return "sms";
  return /@/.test(t) ? "correo" : "sms";
}
function remitenteDe(ls, canal) {
  const cab = ls.slice(0, 4);
  const cabTexto = cab.join(" ");
  const correo = cabTexto.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  if (canal === "correo" && correo) return correo[0];
  // Un teléfono completo en la cabecera: +507 6xxx-xxxx, +1 (xxx) xxx-xxxx, 800-1234
  const tel = cabTexto.match(/\+\d{1,3}\s?\(?\d{3,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}|\b\d{3,4}-\d{4}\b/);
  if (tel) return tel[0].trim();
  // Un identificador de remitente en mayúsculas o un nombre corto, nunca la hora ni la batería ni números sueltos
  for (const l of cab) {
    const s = l.replace(/[<>‹›|+]/g, "").trim();
    if (!s || s.length > 40) continue;
    if (/^\d{1,2}[:.]\d{2}\b|\d{2}%|^[\d\s.:-]+$/.test(s)) continue;
    if (/mensaje de texto|no est[aá] en tus|cuenta de empresa|para m[ií]|ten cuidado|desconocidos/i.test(s)) continue;
    return s.replace(/^[A-Z]\s+(?=[A-Z])/, "");
  }
  // Último recurso: un identificador de remitente en mayúsculas en cualquier línea (BANCODEMO, ALERTAS, COBROS)
  for (const l of ls) {
    const m = l.match(/\b[A-Z][A-Z0-9-]{4,}\b/);
    if (m && !/^(SMS|HTTPS?|WHATSAPP)$/.test(m[0])) return m[0];
  }
  return "";
}
// Reparaciones típicas de OCR/VLM en enlaces: "https:Il" -> "https://", "comlverificar" -> "com/verificar", "bancodemo com" -> "bancodemo.com"
// Sufijos que el OCR suele dejar separados por espacios; «es», «me» y «pa» solos quedan fuera porque son palabras.
const RE_ETIQUETAS_SUELTAS =
  /(https?:\/\/)((?:[a-z0-9-]+[ .]+){1,3}(?:com|net|org|info|app|io|link|ly|gd|gy|co)(?:[ .]pa)?)(?![a-z0-9-])/gi;
function repararEnlaces(t) {
  return (
    t
      .replace(/https?:\s*[/Il|]{1,2}\s*/gi, (m) => (m.toLowerCase().startsWith("https") ? "https://" : "http://"))
      // el OCR lee los puntos del dominio como espacios: "https://app bancodemo com pa" -> "https://app.bancodemo.com.pa"
      .replace(RE_ETIQUETAS_SUELTAS, (_m, esquema, etiquetas) => esquema + etiquetas.trim().split(/[ .]+/).join("."))
      .replace(
        /(https?:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)*)\s+(com|net|org|app|info|co|pa|link|ly|gd|gy|io|es|me)\b/gi,
        "$1.$2",
      )
      .replace(/(https?:\/\/[a-z0-9.-]+\.(?:com|net|org|app|info|co|pa|link|ly|gd|gy|io|es|me))[lI|](?=[a-z])/gi, "$1/")
      // enlace partido por el salto de línea: "https://seguridad-banc codemo.com/verificar" -> unido
      .replace(
        /(https?:\/\/[a-z0-9-]+)\s+([a-z0-9-]+\.(?:com|net|org|app|info|co|pa|link|ly|gd|gy|io|es|me)\b(?:\/\S*)?)/gi,
        "$1$2",
      )
      .replace(/\bBI\.\s?(\d)/g, "B/. $1")
  );
}
// De líneas de texto (de cualquier lector) a los campos de la captura. Determinista.
function derivar(ls) {
  const texto = repararEnlaces(unir(ls));
  const enlaces = [...new Set((texto.match(RE_URL) || []).map((u) => u.replace(/[.,;:)]+$/, "")))].filter(
    (u) => !/@/.test(u) && !/^\d/.test(u),
  );
  const telefonos = [...new Set(texto.match(RE_TEL) || [])].map((t) => t.trim());
  const montos = [...new Set(texto.match(RE_MONTO) || [])];
  const canal = canalDe(ls);
  const remitente = remitenteDe(ls, canal);
  const cuerpoLs = ls.filter(
    (l) =>
      !/^\d{1,2}[:.]\d{2}\b|\d{2}%$|^mensaje de texto|^no est[aá] en tus contactos|^este n[uú]mero no|^cuenta de empresa|^para m[ií]|^mensaje$|^[‹<>›|+]$|^[A-Z]$/i.test(
        l.trim(),
      ),
  );
  const cuerpo = repararEnlaces(unir(cuerpoLs));
  return { texto, cuerpo, enlaces, telefonos, montos, canal, remitente };
}

module.exports = { derivar, unir, repararEnlaces, canalDe, remitenteDe, RE_URL, RE_TEL, RE_MONTO };
