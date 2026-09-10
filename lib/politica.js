// RAG sobre la política anti-fraude del banco con el vector store del SDK y EmbeddingGemma.
// La política se parte por secciones y viñetas; cada consulta recupera los fragmentos que Qwen3 debe citar.
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const modelos = require("./modelos");
const perf = require("./perf");

const RUTA = path.join(__dirname, "..", "data", "politica-antifraude.md");

// Fragmentos con contexto: cada viñeta o párrafo lleva el título de su sección delante.
function fragmentar(md) {
  const out = [];
  let seccion = "";
  for (const linea of md.split("\n")) {
    const l = linea.trim();
    if (!l || l.startsWith("# ")) continue;
    if (l.startsWith("## ")) {
      seccion = l.replace(/^##\s*/, "");
      continue;
    }
    const cuerpo = l.replace(/^[-*]\s+|^\d+\.\s+/, "");
    if (cuerpo.length > 12) out.push(seccion ? `${seccion}: ${cuerpo}` : cuerpo);
  }
  return out;
}

class Politica {
  constructor() {
    this.embedId = null;
    this.workspace = null;
    this.fragmentos = [];
    this.lista = false;
  }

  async cargar() {
    if (this.embedId) return this.embedId;
    const e = modelos.entrada("embed", modelos.DEFECTOS.embed);
    const S = await modelos.sdk();
    const t0 = Date.now();
    this.embedId = await S.loadModel(await modelos.argsCarga(e));
    perf.registrar({ modelo: e.label, constante: e.constName, tarea: "carga", carga_modelo_ms: Date.now() - t0 });
    return this.embedId;
  }

  // Indexa una vez por contenido: el nombre del workspace lleva el hash de la política, así un cambio reindexa solo.
  async indexar() {
    if (this.lista) return;
    await this.cargar();
    const S = await modelos.sdk();
    const md = fs.readFileSync(RUTA, "utf8");
    this.fragmentos = fragmentar(md);
    this.workspace = `politica-${crypto.createHash("sha256").update(md).digest("hex").slice(0, 12)}`;
    const t0 = Date.now();
    let existe = false;
    try {
      existe = (await S.ragListWorkspaces()).some((w) => (w.name || w.workspace || w.id || w) === this.workspace);
    } catch {
      existe = false;
    }
    if (!existe) {
      await S.ragIngest({
        modelId: this.embedId,
        documents: this.fragmentos,
        workspace: this.workspace,
        chunking: { chunkSize: 400, chunkOverlap: 0 },
      }).catch(async (err) => {
        // Si esta versión del SDK no acepta las opciones de chunking, se ingesta con las de fábrica.
        if (!/chunk/i.test(String(err && err.message))) throw err;
        await S.ragIngest({ modelId: this.embedId, documents: this.fragmentos, workspace: this.workspace });
      });
    }
    perf.registrar({
      modelo: "EmbeddingGemma 300M",
      tarea: existe ? "rag_abrir" : "rag_ingesta",
      total_ms: Date.now() - t0,
      fragmentos: this.fragmentos.length,
    });
    this.lista = true;
  }

  // Devuelve los fragmentos más cercanos a la consulta: [{ texto, score }]
  async buscar(consulta, topK = 3) {
    await this.indexar();
    const S = await modelos.sdk();
    const t0 = Date.now();
    const res = await S.ragSearch({ modelId: this.embedId, query: consulta, topK, workspace: this.workspace });
    perf.registrar({
      modelo: "EmbeddingGemma 300M",
      tarea: "rag_busqueda",
      total_ms: Date.now() - t0,
      resultados: res.length,
    });
    return res.map((r) => ({ texto: String(r.content || r.text || r.document || ""), score: r.score }));
  }

  // Consulta a partir de lo que se sabe del mensaje: señales y texto.
  consultaPara({ captura, senales }) {
    const partes = (senales || []).map((s) => s.tipo.replace(/_/g, " "));
    if (captura && captura.texto) partes.push(captura.texto.slice(0, 200));
    return partes.join(". ") || "mensaje sospechoso del banco";
  }

  async descargar() {
    if (!this.embedId) return;
    const S = await modelos.sdk();
    try {
      await S.ragCloseWorkspace({ workspace: this.workspace });
    } catch {
      /* */
    }
    try {
      await S.unloadModel({ modelId: this.embedId, clearStorage: false });
    } catch {
      /* */
    }
    this.embedId = null;
    this.lista = false;
  }
}

module.exports = { Politica, fragmentar };
