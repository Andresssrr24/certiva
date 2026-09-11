// Lector literal de la captura con el OCR del SDK (EasyOCR latin + CRAFT, ggml). Determinista y exacto
// con texto renderizado: enlaces, teléfonos y montos salen tal cual. Reconstruye líneas por posición.
"use strict";
const path = require("node:path");
const modelos = require("./modelos");
const perf = require("./perf");
const { derivar, unir, repararEnlaces, RE_URL, RE_TEL, RE_MONTO } = require("./derivar");

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
        langList: ["es"],
        magRatio: 1.0,
        defaultRotationAngles: [],
        contrastRetry: false,
        lowConfidenceThreshold: 0.3,
        recognizerBatchSize: 4,
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
