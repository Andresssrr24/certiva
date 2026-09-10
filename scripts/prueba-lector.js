// Prueba del lector OCR sobre N capturas: líneas, campos derivados y veredicto por reglas contra la verdad.
// Uso: node scripts/prueba-lector.js [N=6]
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { Motor } = require("../lib/analizar");
const reglas = require("../lib/reglas");
const verdad = require("../data/verdad.json");
(async () => {
  const n = Number(process.argv[2]) || 6;
  const dir = path.join(__dirname, "..", "data", "capturas");
  const todos = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".png"))
    .sort();
  const tipos = [...new Set(todos.map((f) => f.replace(/-\d+\.png$/, "")))];
  const muestra = [];
  let i = 1;
  while (muestra.length < n) {
    for (const t of tipos) {
      const f = `${t}-${String(i).padStart(2, "0")}.png`;
      if (todos.includes(f) && muestra.length < n) muestra.push(f);
    }
    i++;
    if (i > 8) break;
  }
  const motor = new Motor();
  let ok = 0,
    enlacesOk = 0,
    conEnlaces = 0;
  for (const f of muestra) {
    const id = f.replace(/\.png$/, "");
    const v = verdad[id];
    const r = await motor.extraerCaptura(path.join(dir, f));
    const c = r.captura;
    const s = reglas.evaluar(c, motor.banco);
    const ver = reglas.veredictoPorReglas(s);
    const dv = (v.enlaces || []).map(reglas.dominioDe).sort().join(","),
      dc = (c.enlaces || []).map(reglas.dominioDe).sort().join(",");
    if (v.enlaces.length) {
      conEnlaces++;
      if (dv === dc) enlacesOk++;
    }
    const bien = ver === v.esperado.veredicto;
    if (bien) ok++;
    console.log(
      `\n=== ${id} · OCR ${r.ttft} ms · ${bien ? "✓" : "✗"} reglas ${ver} (esperado ${v.esperado.veredicto}) [${s.map((x) => x.tipo).join(", ")}]`,
    );
    console.log(
      `  canal ${c.canal}${c.canal === v.canal ? "" : " ✗ " + v.canal} · remitente «${c.remitente}» (${v.remitente}) · enlaces ${dv === dc ? "✓" : "✗"} ${JSON.stringify(c.enlaces)} · tel ${JSON.stringify(c.telefonos)} · montos ${JSON.stringify(c.montos)}`,
    );
    console.log(`  texto: ${c.texto.slice(0, 160)}${c.texto.length > 160 ? "…" : ""}`);
  }
  console.log(
    `\nVeredicto por reglas sobre el OCR: ${ok}/${muestra.length} · dominios de enlaces exactos: ${enlacesOk}/${conEnlaces}`,
  );
  await motor.descargarTodo();
  process.exit(0);
})().catch((e) => {
  console.error("✖", e && e.stack ? e.stack : e);
  process.exit(1);
});
