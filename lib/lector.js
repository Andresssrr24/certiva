// Lector literal de la captura con el OCR del SDK (EasyOCR latin + CRAFT, ggml). Determinista y exacto
// con texto renderizado: enlaces, teléfonos y montos salen tal cual. Reconstruye líneas por posición.
"use strict";
const path = require("node:path");
const modelos = require("./modelos");
const perf = require("./perf");

function caja(b) {
  const bb = b.bbox || b.box || b.boundingBox || null;
  if (!bb) return { x: 0, y: 0, h: 20 };
  if (Array.isArray(bb) && Array.isArray(bb[0])) {
    // [[x,y]x4]
    const xs = bb.map((p) => p[0]),
      ys = bb.map((p) => p[1]);
    return { x: Math.min(...xs), y: (Math.min(...ys) + Math.max(...ys)) / 2, h: Math.max(...ys) - Math.min(...ys) };
  }
  if (Array.isArray(bb) && bb.length >= 4 && typeof bb[0] === "number") {
    // [x,y,w,h] o [x1,y1,x2,y2]
    const alto = bb[3] > bb[1] && bb[3] < 4000 && bb[2] > bb[0] ? bb[3] - bb[1] : bb[3];
    return { x: bb[0], y: bb[1] + alto / 2, h: alto };
  }
  if (typeof bb === "object") {
    const h = bb.height || bb.h || 20;
    return { x: bb.x || bb.left || 0, y: (bb.y || bb.top || 0) + h / 2, h };
  }
  return { x: 0, y: 0, h: 20 };
}

// Agrupa bloques en líneas por su centro vertical y las ordena de arriba abajo, izquierda a derecha.
function lineas(bloques) {
  const items = bloques
    .map((b) => ({ texto: String(b.text || "").trim(), conf: b.confidence, ...caja(b) }))
    .filter((b) => b.texto);
  items.sort((a, b) => a.y - b.y || a.x - b.x);
  const out = [];
  for (const it of items) {
    const ult = out[out.length - 1];
    if (ult && Math.abs(ult.y - it.y) < Math.max(10, it.h * 0.6)) {
      ult.partes.push(it);
      ult.y = (ult.y + it.y) / 2;
    } else out.push({ y: it.y, partes: [it] });
  }
  return out.map((l) =>
    l.partes
      .sort((a, b) => a.x - b.x)
      .map((p) => p.texto)
      .join(" "),
  );
}

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
function repararEnlaces(t) {
  return (
    t
      .replace(/https?:\s*[/Il|]{1,2}\s*/gi, (m) => (m.toLowerCase().startsWith("https") ? "https://" : "http://"))
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

class Lector {
  constructor() {
    this.modelId = null;
  }
  async cargar() {
    if (this.modelId) return this.modelId;
    const S = await modelos.sdk();
    const t0 = Date.now();
    this.modelId = await S.loadModel({
      modelSrc: S.OCR_LATIN,
      modelType: S.MODEL_TYPES && S.MODEL_TYPES.ggmlOcr ? S.MODEL_TYPES.ggmlOcr : "ggml-ocr",
      modelConfig: {
        langList: ["es", "en"],
        magRatio: 1.5,
        defaultRotationAngles: [],
        contrastRetry: false,
        lowConfidenceThreshold: 0.3,
        recognizerBatchSize: 1,
      },
    });
    perf.registrar({
      modelo: "OCR latin_g2 + CRAFT (ggml)",
      constante: "OCR_LATIN",
      tarea: "carga",
      carga_modelo_ms: Date.now() - t0,
    });
    return this.modelId;
  }
  async leer(rutaImagen) {
    await this.cargar();
    const S = await modelos.sdk();
    const t0 = Date.now();
    const { blocks } = S.ocr({ modelId: this.modelId, image: path.resolve(rutaImagen), options: { paragraph: false } });
    const bloques = await blocks;
    const ms = Date.now() - t0;
    const ls = lineas(bloques);
    const d = derivar(ls);
    perf.registrar({ modelo: "OCR latin_g2 + CRAFT (ggml)", tarea: "lectura", total_ms: ms, bloques: bloques.length });
    return { bloques, lineas: ls, ...d, ms };
  }
  async descargar() {
    if (!this.modelId) return;
    const S = await modelos.sdk();
    try {
      await S.unloadModel({ modelId: this.modelId, clearStorage: false });
    } catch {
      /* */
    }
    this.modelId = null;
  }
}

module.exports = { Lector, lineas, unir, derivar, repararEnlaces, RE_URL, RE_TEL, RE_MONTO };
