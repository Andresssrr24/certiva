// Catálogo de modelos del proyecto. Nombres de constantes del SDK, nunca URLs: el registro del SDK
// es la fuente de verdad para tamaños y checksums. Patrón tomado de qvac-invoice-manager-demo.
"use strict";
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const CACHE_DIR = path.join(os.homedir(), ".qvac", "models");

let _sdk = null;
async function sdk() { if (!_sdk) _sdk = await import("@qvac/sdk"); return _sdk; }

const CATALOGO = {
  vision: [
    { key: "visionpsy-flash", label: "VisionPsy Nano 460M Flash", constName: "VISIONPSY_NANO_460M_MULTIMODAL_Q8_0", projName: "MMPROJ_VISIONPSY_NANO_460M_MULTIMODAL_Q8_0", extra: { image_no_upscale: "on" }, psy: true,
      nota: "Modelo Psy. Lee la captura en un teléfono con muy pocos tokens visuales." },
    { key: "visionpsy-base", label: "VisionPsy Nano 460M", constName: "VISIONPSY_NANO_460M_MULTIMODAL_Q8_0_1", projName: "MMPROJ_VISIONPSY_NANO_460M_MULTIMODAL_Q8_0_1", psy: true,
      nota: "Variante base de VisionPsy, más tokens visuales." },
    { key: "qwen3vl-2b", label: "Qwen3-VL 2B", constName: "QWEN3VL_2B_MULTIMODAL_Q4_K", projName: "MMPROJ_QWEN3VL_2B_MULTIMODAL_Q4_K",
      nota: "Respaldo de visión. Solo si la decisión de las 11:00 lo pide." },
  ],
  texto: [
    { key: "qwen3-4b", label: "Qwen3 4B", constName: "QWEN3_4B_INST_Q4_K_M", nota: "Veredicto y explicación en el MacBook." },
    { key: "qwen3-1.7b", label: "Qwen3 1.7B", constName: "QWEN3_1_7B_INST_Q4", nota: "Alternativa para teléfono." },
  ],
  voz: [
    { key: "parakeet-tdt", label: "Parakeet TDT 0.6B v3", constName: "PARAKEET_TDT_0_6B_V3_Q8_0", modelType: "parakeet-transcription", nota: "Multilingüe, transcripción en vivo." },
    { key: "whisper-es", label: "Whisper Spanish tiny", constName: "WHISPER_SPANISH_TINY_Q8_0", modelType: "whispercpp-transcription", nota: "Alternativa pequeña en español." },
  ],
  embed: [
    { key: "embeddinggemma", label: "EmbeddingGemma 300M", constName: "EMBEDDINGGEMMA_300M_Q4_0", nota: "Embeddings para el RAG de la política anti-fraude." },
  ],
};

const DEFECTOS = { vision: "visionpsy-flash", texto: "qwen3-4b", voz: "parakeet-tdt", embed: "embeddinggemma" };

function entrada(grupo, key) {
  const lista = CATALOGO[grupo] || [];
  return lista.find((m) => m.key === key) || lista.find((m) => m.key === DEFECTOS[grupo]);
}

function idsEnCache() {
  try { return new Set(fs.readdirSync(CACHE_DIR).map((f) => f.replace(/^[0-9a-f]{16}_/, ""))); } catch { return new Set(); }
}

async function constantes(e) {
  const S = await sdk();
  const c = S[e.constName];
  const p = e.projName ? S[e.projName] : null;
  return { S, c, p, disponible: !!c && (!e.projName || !!p) };
}

// Estado de cada entrada: si el SDK la conoce, si está descargada y cuánto pesa.
async function catalogo() {
  const presentes = idsEnCache();
  const salida = {};
  for (const [grupo, lista] of Object.entries(CATALOGO)) {
    salida[grupo] = [];
    for (const e of lista) {
      const { c, p, disponible } = await constantes(e);
      if (!disponible) { salida[grupo].push({ ...e, disponible: false, enCache: false, bytes: 0 }); continue; }
      const bytes = (c.expectedSize || 0) + (p ? p.expectedSize || 0 : 0);
      const enCache = presentes.has(c.modelId) && (!p || presentes.has(p.modelId));
      salida[grupo].push({ ...e, disponible: true, enCache, bytes, modelId: c.modelId });
    }
  }
  return salida;
}

// Argumentos para loadModel. Los modelos de visión llevan el proyector en modelConfig.
async function argsCarga(e, { ctxSize = 4096 } = {}) {
  const { c, p, disponible } = await constantes(e);
  if (!disponible) throw new Error(`${e.label}: la constante ${e.constName} no existe en esta versión del SDK`);
  const cfg = { reasoning_budget: 0, ...(e.extra || {}) };
  const modelType = e.modelType || c.engine;
  if (!p) return { modelSrc: c.src || c, modelType, modelConfig: cfg };
  return { modelSrc: c.src, modelType, modelConfig: { ...cfg, device: "gpu", projectionModelSrc: p.src, ctx_size: ctxSize } };
}

// Descarga sin cargar. Un modelo de visión son dos archivos y el progreso se reporta sobre el par.
async function descargar(e, onProgress) {
  const { S, c, p, disponible } = await constantes(e);
  if (!disponible) throw new Error(`${e.label}: no disponible en esta versión del SDK`);
  const lista = [c, p].filter(Boolean);
  const totales = lista.map((a) => a.expectedSize || 0);
  const total = totales.reduce((x, y) => x + y, 0);
  const hecho = lista.map(() => 0);
  for (let i = 0; i < lista.length; i++) {
    await S.downloadAsset({
      assetSrc: lista[i].src,
      onProgress: (pr) => {
        if (!pr || typeof pr.percentage !== "number") return;
        hecho[i] = (totales[i] * pr.percentage) / 100;
        const suma = hecho.reduce((x, y) => x + y, 0);
        if (onProgress) onProgress({ modelo: e.label, porcentaje: total ? Math.min(100, (suma / total) * 100) : pr.percentage, descargado: suma, total, archivo: i + 1, archivos: lista.length });
      },
    });
    hecho[i] = totales[i];
  }
  return { bytes: total, archivos: lista.length };
}

module.exports = { CATALOGO, DEFECTOS, CACHE_DIR, sdk, entrada, catalogo, argsCarga, descargar, idsEnCache };
