// El motor: captura -> VisionPsy (esquema) -> reglas -> Qwen3 (esquema) -> veredicto con razones.
// Todo local. Un solo proceso carga los modelos; la UI habla con él por IPC.
"use strict";
const path = require("node:path");
const { ESQUEMA_CAPTURA, ESQUEMA_VEREDICTO, PROMPT_CAPTURA, promptVeredicto } = require("./esquemas");
const reglas = require("./reglas");
const modelos = require("./modelos");
const perf = require("./perf");
const { Lector } = require("./lector");
const { RE_PIDE_PUBLICA, RE_URGENCIA_PUBLICA } = require("./reglas");

const QUIET_MS = 120000;

class Motor {
  constructor({ banco = require("../data/banco-demo.json"), visionKey, textoKey } = {}) {
    this.banco = banco;
    this.visionKey = visionKey || modelos.DEFECTOS.vision;
    this.textoKey = textoKey || modelos.DEFECTOS.texto;
    this.visionId = null;
    this.textoId = null;
    this.onProgress = null;
    this.lector = new Lector();
    // Lector por defecto: OCR determinista. VisionPsy queda como lector experimental medido en la evaluación.
    this.lectorKey = process.env.LECTOR || "ocr";
  }

  _progreso(etiqueta) {
    return (p) => { if (this.onProgress && p && typeof p.percentage === "number") this.onProgress({ modelo: etiqueta, porcentaje: p.percentage }); };
  }

  // Un load que nunca resuelve es otra app QVAC abierta: comparten el worker de ~/.qvac.
  async _carga(etiqueta, fn) {
    let timer;
    const guardia = new Promise((_r, rej) => { timer = setTimeout(() => rej(new Error(`${etiqueta} no cargó en ${QUIET_MS / 1000}s. ¿Hay otra app QVAC abierta? Comparten un solo worker.`)), QUIET_MS); });
    try { return await Promise.race([fn(), guardia]); } finally { clearTimeout(timer); }
  }

  async cargarVision() {
    if (this.visionId) return this.visionId;
    const e = modelos.entrada("vision", this.visionKey);
    const S = await modelos.sdk();
    const t0 = Date.now();
    const args = await modelos.argsCarga(e, { ctxSize: 4096 });
    this.visionId = await this._carga(e.label, () => S.loadModel({ ...args, onProgress: this._progreso(e.label) }));
    perf.registrar({ modelo: e.label, constante: e.constName, tarea: "carga", carga_modelo_ms: Date.now() - t0 });
    return this.visionId;
  }

  async cargarTexto() {
    if (this.textoId) return this.textoId;
    const e = modelos.entrada("texto", this.textoKey);
    const S = await modelos.sdk();
    const t0 = Date.now();
    const args = await modelos.argsCarga(e);
    this.textoId = await this._carga(e.label, () => S.loadModel({ ...args, onProgress: this._progreso(e.label) }));
    perf.registrar({ modelo: e.label, constante: e.constName, tarea: "carga", carga_modelo_ms: Date.now() - t0 });
    return this.textoId;
  }

  async _completar({ modelId, history, esquema, nombre, etiqueta, tarea }) {
    const S = await modelos.sdk();
    const t0 = Date.now();
    let ttft = null;
    const run = S.completion({ modelId, history, stream: true, responseFormat: { type: "json_schema", json_schema: { name: nombre, schema: esquema } } });
    for await (const ev of run.events) { if (ttft === null && ev && ev.type === "contentDelta") ttft = Date.now() - t0; }
    const final = await run.final;
    const total = Date.now() - t0;
    const texto = String((final && final.contentText) || "");
    const uso = (final && (final.usage || final.stats)) || null;
    const salida = uso && (uso.completionTokens || uso.output_tokens || uso.completion_tokens || uso.tokens_out || null);
    const entradaTk = uso && (uso.promptTokens || uso.prompt_tokens || uso.input_tokens || null);
    perf.registrar({ modelo: etiqueta, tarea, ttft_ms: ttft, total_ms: total, prompt_tokens: entradaTk, output_tokens: salida,
      tokens_por_segundo: salida && total > ttft ? Number((salida / ((total - (ttft || 0)) / 1000)).toFixed(1)) : null, uso_crudo: uso });
    return { texto, ttft, total, uso };
  }

  // Lectura literal con OCR y campos derivados con expresiones regulares. Sin modelo generativo en esta etapa.
  async extraerConOcr(rutaImagen) {
    const t0 = Date.now();
    const l = await this.lector.leer(rutaImagen);
    const cuerpo = l.cuerpo || l.texto;
    const captura = {
      canal: l.canal, remitente: l.remitente, texto: cuerpo, enlaces: l.enlaces, telefonos: l.telefonos, montos: l.montos,
      pide_datos_sensibles: RE_PIDE_PUBLICA.test(cuerpo), urgencia: RE_URGENCIA_PUBLICA.test(cuerpo),
    };
    return { captura, ttft: l.ms, ms: Date.now() - t0, modelo: "OCR latin_g2 + CRAFT (ggml)", crudo: l.texto, lineas: l.lineas };
  }

  // Lectura con VisionPsy y esquema JSON. Medida en la evaluación; no es el lector por defecto.
  async extraerConVision(rutaImagen) {
    await this.cargarVision();
    const e = modelos.entrada("vision", this.visionKey);
    const r = await this._completar({
      modelId: this.visionId, esquema: ESQUEMA_CAPTURA, nombre: "captura", etiqueta: e.label, tarea: "extraccion",
      history: [{ role: "user", content: PROMPT_CAPTURA, attachments: [{ path: path.resolve(rutaImagen) }] }],
    });
    let captura;
    try { captura = JSON.parse(r.texto.trim()); } catch { captura = null; }
    return { captura, ttft: r.ttft, ms: r.total, modelo: e.label, crudo: r.texto };
  }

  async extraerCaptura(rutaImagen) {
    return this.lectorKey === "visionpsy" ? this.extraerConVision(rutaImagen) : this.extraerConOcr(rutaImagen);
  }

  async veredicto(captura, senales) {
    await this.cargarTexto();
    const e = modelos.entrada("texto", this.textoKey);
    const r = await this._completar({
      modelId: this.textoId, esquema: ESQUEMA_VEREDICTO, nombre: "veredicto", etiqueta: e.label, tarea: "veredicto",
      history: promptVeredicto({ captura, senales, banco: this.banco }),
    });
    let v;
    try { v = JSON.parse(r.texto.trim()); } catch { v = null; }
    return { veredicto: v, ttft: r.ttft, ms: r.total, modelo: e.label, crudo: r.texto };
  }

  async analizar(rutaImagen) {
    const ext = await this.extraerCaptura(rutaImagen);
    if (!ext.captura) return { ok: false, etapa: "extraccion", detalle: ext };
    const senales = reglas.evaluar(ext.captura, this.banco);
    const base = reglas.veredictoPorReglas(senales);
    const ver = await this.veredicto(ext.captura, senales);
    return { ok: true, captura: ext.captura, senales, veredicto_reglas: base, veredicto: ver.veredicto, tiempos: { extraccion_ttft_ms: ext.ttft, extraccion_ms: ext.ms, veredicto_ttft_ms: ver.ttft, veredicto_ms: ver.ms }, modelos: { vision: ext.modelo, texto: ver.modelo }, crudo: { captura: ext.crudo, veredicto: ver.crudo } };
  }

  async descargarTodo() {
    await this.lector.descargar();
    const ids = [this.visionId, this.textoId].filter(Boolean);
    if (!ids.length) return; // no arrancar el worker solo para no descargar nada
    const S = await modelos.sdk();
    for (const id of ids) { try { await S.unloadModel({ modelId: id, clearStorage: false }); } catch { /* */ } }
    this.visionId = null; this.textoId = null;
  }
}

module.exports = { Motor };
