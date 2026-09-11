// El motor: captura -> VisionPsy (esquema) -> reglas -> Qwen3 (esquema) -> veredicto con razones.
// Todo local. Un solo proceso carga los modelos; la UI habla con él por IPC.
"use strict";
const path = require("node:path");
const {
  ESQUEMA_CAPTURA,
  ESQUEMA_VEREDICTO,
  PROMPT_CAPTURA,
  PROMPT_TRANSCRIBIR,
  promptVeredicto,
} = require("./esquemas");
const reglas = require("./reglas");
const modelos = require("./modelos");
const perf = require("./perf");
const { Lector, derivar } = require("./lector");
const { Politica } = require("./politica");
const { RE_PIDE_PUBLICA, RE_URGENCIA_PUBLICA, RE_URGENCIA_DIFUSA, pideDatosDifuso, normaliza } = require("./reglas");

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
    this.politica = new Politica();
    this.usarPolitica = process.env.SIN_RAG !== "1";
    // Contraste con OCR: solo en correos con un dominio que se parece al oficial. Corrige transcripciones de VisionPsy.
    this.contrasteOcr = process.env.SIN_CONTRASTE !== "1";
    // VisionPsy es el lector principal; el OCR se usa para contrastes locales.
    this.lectorKey = process.env.LECTOR || "visionpsy";
  }

  _progreso(etiqueta) {
    return (p) => {
      if (this.onProgress && p && typeof p.percentage === "number")
        this.onProgress({ modelo: etiqueta, porcentaje: p.percentage });
    };
  }

  // Un load que nunca resuelve es otra app QVAC abierta: comparten el worker de ~/.qvac.
  async _carga(etiqueta, fn) {
    let timer;
    const guardia = new Promise((_r, rej) => {
      timer = setTimeout(
        () =>
          rej(
            new Error(
              `${etiqueta} no cargó en ${QUIET_MS / 1000}s. ¿Hay otra app QVAC abierta? Comparten un solo worker.`,
            ),
          ),
        QUIET_MS,
      );
    });
    try {
      return await Promise.race([fn(), guardia]);
    } finally {
      clearTimeout(timer);
    }
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
    const run = S.completion({
      modelId,
      history,
      stream: true,
      responseFormat: { type: "json_schema", json_schema: { name: nombre, schema: esquema } },
    });
    for await (const ev of run.events) {
      if (ttft === null && ev && ev.type === "contentDelta") ttft = Date.now() - t0;
    }
    const final = await run.final;
    const total = Date.now() - t0;
    const texto = String((final && final.contentText) || "");
    // El SDK entrega en final.stats: timeToFirstToken, tokensPerSecond, promptTokens, generatedTokens, backendDevice
    const uso = (final && (final.stats || final.usage)) || null;
    perf.registrar({
      modelo: etiqueta,
      tarea,
      ttft_ms: uso && uso.timeToFirstToken ? Math.round(uso.timeToFirstToken) : ttft,
      total_ms: total,
      prompt_tokens: uso ? (uso.promptTokens ?? null) : null,
      output_tokens: uso ? (uso.generatedTokens ?? null) : null,
      tokens_por_segundo: uso && uso.tokensPerSecond ? Number(uso.tokensPerSecond.toFixed(1)) : null,
      backend: uso ? (uso.backendDevice ?? null) : null,
    });
    return { texto, ttft, total, uso };
  }

  // Lectura literal con OCR y campos derivados con expresiones regulares. Sin modelo generativo en esta etapa.
  async extraerConOcr(rutaImagen) {
    const t0 = Date.now();
    const l = await this.lector.leer(rutaImagen);
    const cuerpo = l.cuerpo || l.texto;
    const captura = {
      canal: l.canal,
      remitente: l.remitente,
      texto: cuerpo,
      enlaces: l.enlaces,
      telefonos: l.telefonos,
      montos: l.montos,
      pide_datos_sensibles: RE_PIDE_PUBLICA.test(cuerpo) || !!pideDatosDifuso(cuerpo),
      urgencia: RE_URGENCIA_PUBLICA.test(cuerpo) || RE_URGENCIA_DIFUSA.test(normaliza(cuerpo)),
    };
    return {
      captura,
      ttft: l.ms,
      ms: Date.now() - t0,
      modelo: "OCR latin_g2 + CRAFT (ggml)",
      crudo: l.texto,
      lineas: l.lineas,
    };
  }

  // Lectura con VisionPsy: transcripción libre (lo que el modelo hace bien) y campos derivados por reglas.
  // Es el lector por defecto: el modelo Psy es el único que mira la imagen.
  async extraerConVision(rutaImagen) {
    await this.cargarVision();
    const e = modelos.entrada("vision", this.visionKey);
    const S = await modelos.sdk();
    const t0 = Date.now();
    let ttft = null;
    const run = S.completion({
      modelId: this.visionId,
      stream: true,
      history: [{ role: "user", content: PROMPT_TRANSCRIBIR, attachments: [{ path: path.resolve(rutaImagen) }] }],
    });
    for await (const ev of run.events) {
      if (ttft === null && ev && ev.type === "contentDelta") ttft = Date.now() - t0;
    }
    const final = await run.final;
    const total = Date.now() - t0;
    const crudo = String((final && final.contentText) || "").trim();
    const uso = (final && (final.stats || final.usage)) || null;
    perf.registrar({
      modelo: e.label,
      constante: e.constName,
      tarea: "transcripcion",
      ttft_ms: uso && uso.timeToFirstToken ? Math.round(uso.timeToFirstToken) : ttft,
      total_ms: total,
      prompt_tokens: uso ? (uso.promptTokens ?? null) : null,
      output_tokens: uso ? (uso.generatedTokens ?? null) : null,
      tokens_por_segundo: uso && uso.tokensPerSecond ? Number(uso.tokensPerSecond.toFixed(1)) : null,
      backend: uso ? (uso.backendDevice ?? null) : null,
    });
    const ls = crudo
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);
    const d = derivar(ls);
    const cuerpo = d.cuerpo || d.texto;
    const captura = {
      canal: d.canal,
      remitente: d.remitente,
      texto: cuerpo,
      enlaces: d.enlaces,
      telefonos: d.telefonos,
      montos: d.montos,
      pide_datos_sensibles: RE_PIDE_PUBLICA.test(cuerpo) || !!pideDatosDifuso(cuerpo),
      urgencia: RE_URGENCIA_PUBLICA.test(cuerpo) || RE_URGENCIA_DIFUSA.test(normaliza(cuerpo)),
    };
    return { captura, ttft, ms: total, modelo: e.label, crudo, lineas: ls };
  }

  // Lectura con VisionPsy y esquema JSON de ocho campos. Se mantiene solo para la comparación medida: el modelo inventa campos.
  async extraerConVisionEsquema(rutaImagen) {
    await this.cargarVision();
    const e = modelos.entrada("vision", this.visionKey);
    const r = await this._completar({
      modelId: this.visionId,
      esquema: ESQUEMA_CAPTURA,
      nombre: "captura",
      etiqueta: e.label,
      tarea: "extraccion_esquema",
      history: [{ role: "user", content: PROMPT_CAPTURA, attachments: [{ path: path.resolve(rutaImagen) }] }],
    });
    let captura;
    try {
      captura = JSON.parse(r.texto.trim());
    } catch {
      captura = null;
    }
    return { captura, ttft: r.ttft, ms: r.total, modelo: e.label + " (esquema)", crudo: r.texto };
  }

  async extraerCaptura(rutaImagen) {
    if (this.lectorKey === "ocr") return this.extraerConOcr(rutaImagen);
    if (this.lectorKey === "visionpsy-esquema") return this.extraerConVisionEsquema(rutaImagen);
    return this.extraerConVision(rutaImagen);
  }

  // Contraste: lee la misma imagen con el OCR y busca, sin puntos ni espacios, los dominios oficiales y los sospechosos.
  // Si el OCR ve el oficial y no ve el sospechoso, el enlace se corrige al oficial y la señal desaparece.
  async contrastar(rutaImagen, captura, senales) {
    const t0 = Date.now();
    const ocr = await this.lector.leer(rutaImagen);
    const aplanar = (t) =>
      String(t || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    const plano = aplanar(ocr.texto);
    const oficiales = this.banco.dominios_oficiales.map((d) => d.toLowerCase());
    const sospechosos = new Set();
    for (const x of senales) {
      if (x.tipo !== "dominio_parecido" && x.tipo !== "dominio_no_oficial") continue;
      const mm = x.evidencia.match(/dominio ([a-z0-9.-]+)|enlaza a ([a-z0-9.-]+)/i);
      const dom = mm && (mm[1] || mm[2]);
      if (dom) sospechosos.add(dom.toLowerCase());
    }
    const correcciones = [];
    const enlaces = (captura.enlaces || []).map((enlace) => {
      const dom = reglas.dominioDe(enlace);
      if (!dom || !sospechosos.has(dom) || oficiales.includes(dom)) return enlace;
      const oficialVisto = oficiales.find((o) => plano.includes(aplanar(o)));
      const sospechosoVisto = plano.includes(aplanar(dom));
      if (oficialVisto && !sospechosoVisto) {
        correcciones.push({ de: dom, a: oficialVisto });
        return enlace.replace(dom, oficialVisto);
      }
      return enlace;
    });
    perf.registrar({
      modelo: "OCR latin_g2 + CRAFT (ggml)",
      tarea: "contraste",
      total_ms: Date.now() - t0,
      correcciones: correcciones.length,
    });
    return {
      usado: true,
      ms: Date.now() - t0,
      correcciones,
      dominios_sospechosos: [...sospechosos],
      captura: { ...captura, enlaces },
    };
  }

  async veredicto(captura, senales, base) {
    await this.cargarTexto();
    // Fragmentos de la política del banco para este caso; si el RAG falla, el veredicto sale igual sin ellos.
    let politica = [];
    if (this.usarPolitica) {
      try {
        politica = (await this.politica.buscar(this.politica.consultaPara({ captura, senales }), 3)).map(
          (f) => f.texto,
        );
      } catch (e) {
        perf.registrar({ tarea: "rag_error", error: String(e.message || e).slice(0, 160) });
      }
    }
    if (captura && typeof captura.texto === "string" && captura.texto.length > 1200)
      captura = { ...captura, texto: captura.texto.slice(0, 1200) + "…" };
    const e = modelos.entrada("texto", this.textoKey);
    const r = await this._completar({
      modelId: this.textoId,
      esquema: ESQUEMA_VEREDICTO,
      nombre: "veredicto",
      etiqueta: e.label,
      tarea: "veredicto",
      history: promptVeredicto({ captura, senales, banco: this.banco, base, politica }),
    });
    let v;
    try {
      v = JSON.parse(r.texto.trim());
    } catch {
      v = null;
    }
    return { veredicto: v, ttft: r.ttft, ms: r.total, modelo: e.label, crudo: r.texto, politica };
  }

  // onEtapa({ etapa, estado, ms }) avisa a la interfaz en qué paso va: vision, reglas, veredicto.
  async analizar(rutaImagen, { onEtapa } = {}) {
    const aviso = (etapa, estado, ms) => {
      if (onEtapa) {
        try {
          onEtapa({ etapa, estado, ms });
        } catch {
          /* */
        }
      }
    };
    const inicio = Date.now();
    aviso("vision", "inicio");
    const ext = await this.extraerCaptura(rutaImagen);
    aviso("vision", "fin", ext.ms);
    if (!ext.captura) return { ok: false, etapa: "extraccion", detalle: ext };
    aviso("reglas", "inicio");
    const t1 = Date.now();
    let senales = reglas.evaluar(ext.captura, this.banco);
    aviso("reglas", "fin", Date.now() - t1);
    // Un dominio «parecido» en un correo puede ser el oficial mal transcrito: se contrasta con el OCR determinista.
    let contraste = null;
    if (
      this.contrasteOcr &&
      ext.captura.canal === "correo" &&
      senales.some((x) => x.tipo === "dominio_parecido" || x.tipo === "dominio_no_oficial")
    ) {
      aviso("ocr", "inicio");
      const t2 = Date.now();
      try {
        contraste = await this.contrastar(rutaImagen, ext.captura, senales);
        if (contraste.correcciones.length) {
          ext.captura = contraste.captura;
          senales = reglas.evaluar(ext.captura, this.banco);
        }
      } catch (e) {
        contraste = { usado: false, error: String(e.message || e).slice(0, 120) };
      }
      aviso("ocr", "fin", Date.now() - t2);
    }
    let base = reglas.veredictoPorReglas(senales);
    // Antes de comunicar ausencia de señales, contrastar con un segundo lector local.
    // Coincidencia no significa autenticidad; discrepancia o fallo obliga a abstenerse.
    let revision = null;
    if (base === "sin_senales" && this.lectorKey !== "ocr") {
      aviso("ocr", "inicio");
      const t = Date.now();
      try {
        const segunda = await this.extraerConOcr(rutaImagen);
        const otras = reglas.evaluar(segunda.captura, this.banco);
        const otroBase = reglas.veredictoPorReglas(otras);
        const tokens = (texto) => new Set(normaliza(texto || "").match(/[a-z0-9]+/g) || []);
        const a = tokens(ext.captura.texto),
          b = tokens(segunda.captura.texto);
        const union = new Set([...a, ...b]);
        const acuerdo = union.size ? [...a].filter((x) => b.has(x)).length / union.size : 0;
        revision = { estado: "contrastada", acuerdo, ms: Date.now() - t };
        if (otroBase !== "sin_senales") {
          senales = otras.map((x) => ({ ...x, evidencia: `Segunda lectura OCR: ${x.evidencia}` }));
          base = otroBase;
          revision.estado = "alerta_segunda_lectura";
        } else if (a.size < 4 || b.size < 4 || acuerdo < 0.65) {
          revision.estado = "no_concluyente";
          base = "no_legible";
        }
      } catch (e) {
        revision = { estado: "no_concluyente", error: String(e.message || e).slice(0, 120), ms: Date.now() - t };
        base = "no_legible";
      }
      aviso("ocr", "fin", revision.ms);
    }
    if (!String(ext.captura.texto || "").trim()) base = "no_legible";
    aviso("veredicto", "inicio");
    let ver;
    try {
      ver = await this.veredicto(ext.captura, senales, base);
    } catch (e) {
      ver = { veredicto: null, ms: 0, error: String(e.message || e).slice(0, 120) };
    }
    aviso("veredicto", "fin", ver.ms);
    // Las señales finales son las de las reglas más, como máximo, la adicional del modelo.
    if (ver.veredicto) {
      const extra = ver.veredicto.senal_adicional;
      const tipos = new Set(senales.map((x) => x.tipo));
      const adicionales =
        extra && extra.tipo && extra.tipo !== "ninguna" && extra.evidencia && !tipos.has(extra.tipo) ? [extra] : [];
      // La gramática garantiza la forma, no el rango: si el modelo da 95 en vez de 0,95 se normaliza.
      let conf = Number(ver.veredicto.confianza);
      if (!Number.isFinite(conf)) conf = 0.5;
      else if (conf > 1) conf = Math.min(1, conf / 100);
      ver.veredicto = { ...ver.veredicto, confianza: conf, senales: [...senales, ...adicionales] };
      delete ver.veredicto.senal_adicional;
    }
    const { asegurarVeredicto } = require("./seguridad");
    ver.veredicto = asegurarVeredicto(ver.veredicto, base, senales, this.banco);
    return {
      ok: true,
      revision,
      captura: ext.captura,
      senales,
      veredicto_reglas: base,
      contraste,
      veredicto: ver.veredicto,
      tiempos: {
        total_ms: Date.now() - inicio,
        revision_ms: revision?.ms || 0,
        extraccion_ttft_ms: ext.ttft,
        extraccion_ms: ext.ms,
        veredicto_ttft_ms: ver.ttft,
        veredicto_ms: ver.ms,
      },
      modelos: { vision: ext.modelo, texto: ver.modelo },
      crudo: { captura: ext.crudo, veredicto: ver.crudo },
    };
  }

  async descargarTodo() {
    await this.lector.descargar();
    await this.politica.descargar();
    const ids = [this.visionId, this.textoId].filter(Boolean);
    if (!ids.length) return; // no arrancar el worker solo para no descargar nada
    const S = await modelos.sdk();
    for (const id of ids) {
      try {
        await S.unloadModel({ modelId: id, clearStorage: false });
      } catch {
        /* */
      }
    }
    this.visionId = null;
    this.textoId = null;
  }
}

module.exports = { Motor };
