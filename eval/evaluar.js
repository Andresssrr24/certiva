// Evaluación reproducible sobre el set sintético: corre el pipeline completo sobre cada captura y
// compara con data/verdad.json. Escribe eval/results.md. El registro por llamada queda en eval/perf.jsonl.
// Uso: node eval/evaluar.js [máximo]   (el máximo sirve para una corrida corta)
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { Motor } = require("../lib/analizar");
const crypto = require("node:crypto");
const externo = process.env.EVAL_DATASET ? path.resolve(process.env.EVAL_DATASET) : null;
const dirDatos = externo || path.join(__dirname, "..", "data");
const verdad = JSON.parse(fs.readFileSync(path.join(dirDatos, "verdad.json"), "utf8"));
const salida = process.env.EVAL_OUTPUT
  ? path.resolve(process.env.EVAL_OUTPUT)
  : path.join(__dirname, "runs", new Date().toISOString().replace(/[:.]/g, "-"));
fs.mkdirSync(salida, { recursive: true });
process.env.PERF_LOG = path.join(salida, "perf.jsonl");

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
const dominio = (u) => {
  const m = norm(u).match(/^(?:[a-z]+:\/\/)?([^/\s:?#]+)/);
  return m ? m[1].replace(/^www\./, "") : norm(u);
};
function cer(a, b) {
  // tasa de error de caracteres, Levenshtein normalizada
  a = norm(a);
  b = norm(b);
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return b.length ? dp[a.length][b.length] / b.length : 0;
}

(async () => {
  const max = Number(process.argv[2]) || Infinity;
  // --solo <texto> evalúa solo las capturas cuyo id contiene ese texto, para corridas cortas de una clase.
  const soloI = process.argv.indexOf("--solo");
  const solo = soloI >= 0 ? process.argv[soloI + 1] : null;
  const dir = path.join(dirDatos, "capturas");
  const ids = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".png"))
    .map((f) => f.replace(/\.png$/, ""))
    .filter((id) => verdad[id] && (!solo || id.includes(solo)))
    .sort()
    .slice(0, max);
  if (!ids.length) throw new Error("No hay capturas con verdad. Corre: npm run datos");
  const archivos = ["verdad.json", ...ids.map((id) => `capturas/${id}.png`)];
  fs.writeFileSync(
    path.join(salida, "manifest.json"),
    JSON.stringify(
      {
        fecha: new Date().toISOString(),
        dataset: dirDatos,
        externo: !!externo,
        nota: "Externo no implica independiente: declarar autor y si se usó para ajustar reglas.",
        commit: require("node:child_process")
          .execFileSync("git", ["rev-parse", "HEAD"], { cwd: path.join(__dirname, "..") })
          .toString()
          .trim(),
        cambios: require("node:child_process")
          .execFileSync("git", ["status", "--porcelain"], { cwd: path.join(__dirname, "..") })
          .toString(),
        archivos: Object.fromEntries(
          archivos.map((f) => [
            f,
            crypto
              .createHash("sha256")
              .update(fs.readFileSync(path.join(dirDatos, f)))
              .digest("hex"),
          ]),
        ),
      },
      null,
      2,
    ),
  );
  const motor = new Motor();
  const filas = [];
  const campos = { canal: 0, remitente: 0, enlaces: 0, telefonos: 0, pide_datos_sensibles: 0, urgencia: 0 };
  let cerTotal = 0,
    legibles = 0;
  const conf = {};
  const porClase = {};
  const errores = [];
  const t0 = Date.now();
  for (const id of ids) {
    const v = verdad[id];
    let r;
    try {
      r = await motor.analizar(path.join(dir, `${id}.png`));
    } catch (err) {
      r = { ok: false, etapa: "error", detalle: String((err && err.message) || err).slice(0, 200) };
      errores.push({ id, error: r.detalle });
    }
    const esp = v.esperado.veredicto;
    const obt = r.ok ? (r.veredicto && r.veredicto.veredicto) || r.veredicto_reglas : "no_legible";
    conf[esp] = conf[esp] || {};
    conf[esp][obt] = (conf[esp][obt] || 0) + 1;
    porClase[esp] = porClase[esp] || { tot: 0, ok: 0 };
    porClase[esp].tot++;
    if (obt === esp) porClase[esp].ok++;
    if (r.ok) {
      legibles++;
      const c = r.captura;
      if (norm(c.canal) === norm(v.canal)) campos.canal++;
      if (norm(c.remitente) === norm(v.remitente)) campos.remitente++;
      const dv = new Set((v.enlaces || []).map(dominio)),
        dc = new Set((c.enlaces || []).map(dominio));
      if ([...dv].every((d) => dc.has(d)) && dc.size === dv.size) campos.enlaces++;
      const tv = new Set((v.telefonos || []).map((t) => String(t).replace(/\D/g, ""))),
        tc = new Set((c.telefonos || []).map((t) => String(t).replace(/\D/g, "")));
      if (tv.size === tc.size && [...tv].every((t) => tc.has(t))) campos.telefonos++;
      if (!!c.pide_datos_sensibles === !!v.pide_datos_sensibles) campos.pide_datos_sensibles++;
      if (!!c.urgencia === !!v.urgencia) campos.urgencia++;
      cerTotal += cer(c.texto, v.texto);
    }
    filas.push({
      id,
      esperado: esp,
      obtenido: obt,
      ok: obt === esp,
      ttft_vision: r.tiempos && r.tiempos.extraccion_ttft_ms,
      ms_vision: r.tiempos && r.tiempos.extraccion_ms,
      total_ms: r.tiempos && r.tiempos.total_ms,
      revision: r.revision,
      ttft_texto: r.tiempos && r.tiempos.veredicto_ttft_ms,
      ms_texto: r.tiempos && r.tiempos.veredicto_ms,
    });
    process.stdout.write(
      `${filas.length}/${ids.length} ${id} -> ${obt}${obt === esp ? "" : "  (esperado " + esp + ")"}\n`,
    );
  }
  await motor.descargarTodo();
  const n = ids.length;
  const aciertos = filas.filter((f) => f.ok).length;
  const fraudeEsp = filas.filter((f) => f.esperado === "fraude");
  const fraudeObt = filas.filter((f) => f.obtenido === "fraude");
  const tp = fraudeEsp.filter((f) => f.obtenido === "fraude").length;
  const precision = fraudeObt.length ? tp / fraudeObt.length : 0;
  const recall = fraudeEsp.length ? tp / fraudeEsp.length : 0;
  const med = (k) => {
    const a = filas
      .map((f) => f[k])
      .filter((x) => typeof x === "number")
      .sort((x, y) => x - y);
    return a.length ? a[Math.floor(a.length / 2)] : null;
  };
  const pct = (x, t) => (t ? `${((100 * x) / t).toFixed(1)}%` : "—");
  const md = [
    `# Resultados sobre ${externo ? "dataset externo (procedencia declarada en manifest)" : "set sintético de desarrollo"}`,
    ``,
    `Fecha: ${new Date().toISOString()} · Capturas: ${n} · Tiempo total: ${Math.round((Date.now() - t0) / 1000)} s`,
    ``,
    `## Veredicto`,
    ``,
    `Falsos negativos de fraude (incluye abstenciones): ${fraudeEsp.filter((f) => f.obtenido !== "fraude").length}/${fraudeEsp.length}.`,
    `Fraudes mostrados sin señales: ${fraudeEsp.filter((f) => f.obtenido === "sin_senales").length}.`,
    `Falsos positivos (no fraude clasificado fraude): ${fraudeObt.filter((f) => f.esperado !== "fraude").length}.`,
    `Abstenciones: ${filas.filter((f) => f.obtenido === "no_legible").length}/${n}.`,
    `Latencia total mediana: ${med("total_ms")} ms. Incluye cargas, RAG y segunda lectura.`,
    ``,
    `| Métrica | Valor |`,
    `|---|---|`,
    `| Exactitud global del veredicto | ${pct(aciertos, n)} |`,
    `| Precisión en fraude | ${(100 * precision).toFixed(1)}% |`,
    `| Exhaustividad en fraude | ${(100 * recall).toFixed(1)}% |`,
    ...Object.entries(porClase).map(([k, v]) => `| Exactitud en «${k}» | ${pct(v.ok, v.tot)} (${v.ok}/${v.tot}) |`),
    ``,
    `Confusión esperado → obtenido: \`${JSON.stringify(conf)}\``,
    ``,
    `## Extracción (VisionPsy) sobre ${legibles} capturas legibles`,
    ``,
    `| Campo | Exactitud |`,
    `|---|---|`,
    ...Object.entries(campos).map(([k, v]) => `| ${k} | ${pct(v, legibles)} |`),
    `| texto (1 − CER medio) | ${legibles ? (100 * (1 - cerTotal / legibles)).toFixed(1) + "%" : "—"} |`,
    ``,
    `## Tiempos (mediana, ms)`,
    ``,
    `| Etapa | TTFT | Total |`,
    `|---|---|---|`,
    `| Extracción con VisionPsy | ${med("ttft_vision")} | ${med("ms_vision")} |`,
    `| Veredicto con Qwen3 | ${med("ttft_texto")} | ${med("ms_texto")} |`,
    ``,
    `Registro por llamada: \`eval/perf.jsonl\`.`,
    ``,
    `## Fallos`,
    ``,
    ...filas.filter((f) => !f.ok).map((f) => `- ${f.id}: esperado ${f.esperado}, obtenido ${f.obtenido}`),
    ``,
    `## Errores de ejecución (${errores.length})`,
    ``,
    ...errores.map((e) => `- ${e.id}: ${e.error}`),
  ].join("\n");
  fs.writeFileSync(path.join(salida, "results.md"), md);
  fs.writeFileSync(path.join(salida, "results.json"), JSON.stringify(filas, null, 2));
  console.log(
    `\nExactitud ${pct(aciertos, n)} · precisión fraude ${(100 * precision).toFixed(1)}% · exhaustividad fraude ${(100 * recall).toFixed(1)}% -> ${salida}/results.md`,
  );
  process.exit(0);
})().catch((e) => {
  console.error("✖", e && e.stack ? e.stack : e);
  process.exit(1);
});
