// Prueba solo de VisionPsy: lee N capturas con el esquema de extracción y compara con la verdad.
// No necesita Qwen3. Uso: node scripts/prueba-vision.js [N=3] [clave de modelo de visión]
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { Motor } = require("../lib/analizar");
const reglas = require("../lib/reglas");
const verdad = require("../data/verdad.json");

(async () => {
  const n = Number(process.argv[2]) || 3;
  const visionKey = process.argv[3];
  const dir = path.join(__dirname, "..", "data", "capturas");
  const todos = fs.readdirSync(dir).filter((f) => f.endsWith(".png")).sort();
  // Muestra variada: alterna fraude y legítimo
  const fraude = todos.filter((f) => f.startsWith("fraude")), legit = todos.filter((f) => f.startsWith("legitimo"));
  const muestra = []; for (let i = 0; muestra.length < n && (fraude[i] || legit[i]); i++) { if (fraude[i]) muestra.push(fraude[i]); if (legit[i] && muestra.length < n) muestra.push(legit[i]); }
  const motor = new Motor({ visionKey });
  motor.onProgress = (p) => process.stdout.write(`  cargando ${p.modelo} ${p.porcentaje.toFixed(0)}%\r`);
  let aciertos = 0;
  for (const f of muestra) {
    const id = f.replace(/\.png$/, "");
    const r = await motor.extraerCaptura(path.join(dir, f));
    const v = verdad[id];
    console.log(`\n=== ${id} · TTFT ${r.ttft} ms · total ${r.ms} ms · ${r.modelo}`);
    if (!r.captura) { console.log("  ✖ JSON inválido:", r.crudo.slice(0, 200)); continue; }
    const c = r.captura;
    const enlacesOk = JSON.stringify((c.enlaces || []).map((x) => reglas.dominioDe(x)).sort()) === JSON.stringify((v.enlaces || []).map((x) => reglas.dominioDe(x)).sort());
    const s = reglas.evaluar(c, motor.banco);
    const ver = reglas.veredictoPorReglas(s);
    const ok = ver === v.esperado.veredicto; if (ok) aciertos++;
    console.log(`  canal ${c.canal} (${v.canal}) · remitente «${c.remitente}» (${v.remitente}) · enlaces ${enlacesOk ? "✓" : "✗ " + JSON.stringify(c.enlaces)} · pide ${c.pide_datos_sensibles} (${v.pide_datos_sensibles}) · urgencia ${c.urgencia} (${v.urgencia})`);
    console.log(`  texto: ${c.texto.slice(0, 140)}${c.texto.length > 140 ? "…" : ""}`);
    console.log(`  reglas sobre la extracción: ${ver} ${ok ? "✓" : "✗ esperado " + v.esperado.veredicto} [${s.map((x) => x.tipo).join(", ")}]`);
  }
  console.log(`\nVeredicto por reglas sobre lo que leyó VisionPsy: ${aciertos}/${muestra.length}`);
  await motor.descargarTodo();
  process.exit(0);
})().catch((e) => { console.error("✖", e && e.stack ? e.stack : e); process.exit(1); });
