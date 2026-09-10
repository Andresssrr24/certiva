// Prueba del modo llamada sin interfaz: transcribe el audio por lotes, dispara las alertas y resume.
// Uso: node scripts/prueba-llamada.js [ruta.wav]   (por defecto data/audio/llamada-vishing.wav)
"use strict";
const path = require("node:path");
const { Motor } = require("../lib/analizar");
const { Llamada } = require("../lib/llamada");
(async () => {
  const ruta = process.argv[2] || path.join(__dirname, "..", "data", "audio", "llamada-vishing.wav");
  const motor = new Motor();
  const ll = new Llamada({ motor });
  const t0 = Date.now();
  const r = await ll.procesarArchivo(ruta, {
    onSegmento: (s) =>
      console.log(`[${s.t0.toFixed(0).padStart(2)}-${s.t1.toFixed(0).padStart(2)} s · ${s.ms} ms] ${s.texto}`),
    onAlerta: (a) => console.log(`  ⚠ ${a.tipo} a los ${a.t.toFixed(0)} s · «${a.frase}» → ${a.mensaje}`),
  });
  console.log(
    `\nTranscripción en ${Date.now() - t0} ms para ${r.duracion_s.toFixed(1)} s de audio · ${r.alertas.length} alertas`,
  );
  const res = await ll.resumir(r);
  console.log("Resumen:", JSON.stringify(res, null, 2));
  await ll.descargar();
  await motor.descargarTodo();
  process.exit(0);
})().catch((e) => {
  console.error("✖", e && e.stack ? e.stack : e);
  process.exit(1);
});
