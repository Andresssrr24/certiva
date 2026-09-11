// Compara modelos de texto en el veredicto: mismo lector, distinto redactor. Sirve para decidir si Qwen3 0.6B entra al teléfono.
// Uso: node scripts/prueba-texto.js <clave del modelo de texto> [N=6]     claves: qwen3-4b, qwen3-1.7b, qwen3-0.6b
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { Motor } = require("../lib/analizar");
const verdad = require("../data/verdad.json");
(async () => {
  const textoKey = process.argv[2] || "qwen3-4b";
  const n = Number(process.argv[3]) || 6;
  const dir = path.join(__dirname, "..", "data", "capturas");
  const ids = ["fraude-bloqueo_enlace-01", "fraude-pide_codigo-01", "fraude-billetera_semilla-01", "legitimo-otp_legitimo-01", "legitimo-oficial_con_urgencia-01", "legitimo-correo_estado_cuenta-01", "fraude-pago_yappy-01", "legitimo-alerta_transaccion-01"].slice(0, n).filter((id) => fs.existsSync(path.join(dir, `${id}.png`)));
  const motor = new Motor({ textoKey });
  let ok = 0;
  const tiempos = [];
  for (const id of ids) {
    const r = await motor.analizar(path.join(dir, `${id}.png`));
    const v = r.veredicto || {};
    const esp = verdad[id].esperado.veredicto;
    const bien = v.veredicto === esp;
    if (bien) ok++;
    tiempos.push(r.tiempos.veredicto_ms);
    console.log(`\n=== ${id} · ${bien ? "✓" : "✗"} ${v.veredicto} (esperado ${esp}) · reglas ${r.veredicto_reglas} · ${r.tiempos.veredicto_ms} ms · confianza ${v.confianza}`);
    console.log(`  acción: ${v.accion}`);
    console.log(`  canal: ${v.canal_oficial}`);
  }
  const med = tiempos.sort((a, b) => a - b)[Math.floor(tiempos.length / 2)];
  console.log(`\n${textoKey}: veredicto ${ok}/${ids.length} · mediana ${med} ms`);
  await motor.descargarTodo();
  process.exit(0);
})().catch((e) => { console.error("✖", e && e.stack ? e.stack : e); process.exit(1); });
