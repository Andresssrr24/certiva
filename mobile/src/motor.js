// El motor en el teléfono. Sin modelo: texto pegado -> derivar -> reglas. Con modelo: VisionPsy transcribe la captura.
// Mismo núcleo que el escritorio: core/reglas.js, core/derivar.js.
"use strict";
const reglas = require("./core/reglas");
const { derivar } = require("./core/derivar");
const { PROMPT_TRANSCRIBIR } = require("./core/esquemas");
const { banco } = require("./consejos");

const VISION = {
  key: "visionpsy-q4",
  nombre: "VISIONPSY_NANO_460M_MULTIMODAL_Q4_K_M",
  proyector: "MMPROJ_VISIONPSY_NANO_460M_MULTIMODAL_Q8_0",
};

let sdk = null;
let visionId = null;
async function cargarSdk() {
  if (!sdk) sdk = await import("@qvac/sdk");
  return sdk;
}

function capturaDesdeTexto(texto) {
  const lineas = String(texto || "")
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const d = derivar(lineas);
  const cuerpo = d.cuerpo || d.texto;
  return {
    canal: d.canal,
    remitente: d.remitente,
    texto: cuerpo,
    enlaces: d.enlaces,
    telefonos: d.telefonos,
    montos: d.montos,
    pide_datos_sensibles: !!(reglas.RE_PIDE_PUBLICA.test(cuerpo) || reglas.pideDatosDifuso(cuerpo)),
    urgencia: reglas.RE_URGENCIA_PUBLICA.test(cuerpo) || reglas.RE_URGENCIA_DIFUSA.test(reglas.normaliza(cuerpo)),
  };
}

// Veredicto sin modelo: reglas sobre el texto. Menos de un milisegundo.
function analizarTexto(texto) {
  const t0 = Date.now();
  const captura = capturaDesdeTexto(texto);
  const senales = reglas.evaluar(captura, banco);
  return {
    ok: true,
    captura,
    senales,
    veredicto: reglas.veredictoPorReglas(senales),
    ms: Date.now() - t0,
    lector: "texto",
  };
}

// Estado del modelo de visión en el teléfono: si está descargado y cuánto pesa.
async function estadoVision() {
  const S = await cargarSdk();
  const c = S[VISION.nombre];
  const p = S[VISION.proyector];
  if (!c || !p) return { disponible: false };
  const bytes = (c.expectedSize || 0) + (p.expectedSize || 0);
  let enCache = false;
  try {
    const info = await S.getModelInfo({ modelSrc: c.src });
    enCache = !!(info && (info.cached || info.isCached || info.downloaded));
  } catch {
    enCache = false;
  }
  return { disponible: true, bytes, enCache };
}

// Descarga VisionPsy (una sola vez) con progreso 0..100.
async function descargarVision(onProgreso) {
  const S = await cargarSdk();
  for (const nombre of [VISION.nombre, VISION.proyector]) {
    await S.downloadAsset({
      assetSrc: S[nombre].src,
      onProgress: (p) =>
        onProgreso &&
        p &&
        typeof p.percentage === "number" &&
        onProgreso(nombre === VISION.nombre ? p.percentage * 0.74 : 74 + p.percentage * 0.26),
    });
  }
}

async function cargarVision(onProgreso) {
  if (visionId) return visionId;
  const S = await cargarSdk();
  visionId = await S.loadModel({
    modelSrc: S[VISION.nombre].src,
    modelType: S[VISION.nombre].engine,
    modelConfig: { device: "gpu", ctx_size: 4096, projectionModelSrc: S[VISION.proyector].src, image_no_upscale: "on" },
    onProgress: (p) => onProgreso && p && typeof p.percentage === "number" && onProgreso(p.percentage),
  });
  return visionId;
}

// Veredicto con captura: VisionPsy transcribe en el teléfono y las reglas deciden.
async function analizarCaptura(rutaImagen, onProgreso) {
  const S = await cargarSdk();
  await cargarVision(onProgreso);
  const t0 = Date.now();
  let ttft = null;
  const run = S.completion({
    modelId: visionId,
    stream: true,
    history: [
      { role: "user", content: PROMPT_TRANSCRIBIR, attachments: [{ path: rutaImagen.replace(/^file:\/\//, "") }] },
    ],
  });
  for await (const ev of run.events) if (ttft === null && ev && ev.type === "contentDelta") ttft = Date.now() - t0;
  const final = await run.final;
  const crudo = String((final && final.contentText) || "").trim();
  const r = analizarTexto(crudo);
  return { ...r, lector: "visionpsy", crudo, ttft, msVision: Date.now() - t0 };
}

async function liberar() {
  if (!visionId) return;
  const S = await cargarSdk();
  try {
    await S.unloadModel({ modelId: visionId, clearStorage: false });
  } catch {
    /* */
  }
  visionId = null;
}

module.exports = { analizarTexto, analizarCaptura, estadoVision, descargarVision, cargarVision, liberar, VISION };
