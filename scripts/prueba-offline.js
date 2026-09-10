// Prueba de punta a punta sin interfaz: captura -> extracción -> reglas -> veredicto. Correr con el Wi-Fi apagado.
// Uso: node scripts/prueba-offline.js [ruta.png]  (por defecto la primera captura de data/capturas)
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { Motor } = require("../lib/analizar");

(async () => {
  let ruta = process.argv[2];
  if (!ruta) {
    const dir = path.join(__dirname, "..", "data", "capturas");
    const f = fs
      .readdirSync(dir)
      .filter((x) => x.endsWith(".png"))
      .sort()[0];
    if (!f) throw new Error("No hay capturas. Corre: npm run datos");
    ruta = path.join(dir, f);
  }
  console.log("Captura:", ruta);
  const motor = new Motor();
  motor.onProgress = (p) => process.stdout.write(`  cargando ${p.modelo} ${p.porcentaje.toFixed(0)}%\r`);
  const t0 = Date.now();
  const r = await motor.analizar(ruta);
  console.log("\n--- extracción ---");
  console.log(JSON.stringify(r.captura || r.detalle, null, 2));
  console.log("--- señales por reglas ---");
  console.log(JSON.stringify(r.senales, null, 2));
  console.log("--- veredicto ---");
  console.log(JSON.stringify(r.veredicto, null, 2));
  console.log("--- tiempos ---");
  console.log(JSON.stringify({ ...r.tiempos, total_ms: Date.now() - t0, modelos: r.modelos }, null, 2));
  const id = path.basename(ruta, ".png");
  try {
    const verdad = require("../data/verdad.json")[id];
    if (verdad)
      console.log(
        `Esperado: ${verdad.esperado.veredicto} [${verdad.esperado.senales.join(", ")}] · Reglas: ${r.veredicto_reglas} · Modelo: ${r.veredicto && r.veredicto.veredicto}`,
      );
  } catch {
    /* sin verdad */
  }
  await motor.descargarTodo();
  process.exit(0);
})().catch((e) => {
  console.error("✖", e && e.stack ? e.stack : e);
  process.exit(1);
});
