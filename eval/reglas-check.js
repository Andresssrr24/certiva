// Chequeo rápido de las reglas deterministas contra la verdad conocida, sin modelos.
// Sirve para no romper nada al tocar lib/reglas.js. Uso: node eval/reglas-check.js
"use strict";
const reglas = require("../lib/reglas");
const banco = require("../data/banco-demo.json");
const verdad = require("../data/verdad.json");
let ok = 0,
  n = 0;
const recall = {};
const fallos = [];
for (const [id, v] of Object.entries(verdad)) {
  const captura = {
    canal: v.canal,
    remitente: v.remitente,
    texto: v.texto,
    enlaces: v.enlaces,
    telefonos: v.telefonos,
    montos: v.montos,
    pide_datos_sensibles: false,
    urgencia: false,
  };
  const s = reglas.evaluar(captura, banco);
  const ver = reglas.veredictoPorReglas(s);
  n++;
  if (ver === v.esperado.veredicto) ok++;
  else fallos.push(`${id}: esperado ${v.esperado.veredicto}, reglas ${ver} [${s.map((x) => x.tipo).join(", ")}]`);
  const tipos = new Set(s.map((x) => x.tipo));
  for (const t of v.esperado.senales) {
    recall[t] = recall[t] || { tot: 0, hit: 0 };
    recall[t].tot++;
    if (tipos.has(t)) recall[t].hit++;
  }
}
console.log(`Veredicto solo con reglas sobre el texto verdadero: ${ok}/${n} (${((100 * ok) / n).toFixed(1)}%)`);
console.log(
  "Recall por señal:",
  Object.entries(recall)
    .map(([k, v]) => `${k} ${v.hit}/${v.tot}`)
    .join(" · "),
);
if (fallos.length) {
  console.log("Fallos:");
  fallos.forEach((f) => console.log("  " + f));
  process.exit(1);
}
