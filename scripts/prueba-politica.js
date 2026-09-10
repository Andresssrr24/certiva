// Prueba del RAG: indexa la política anti-fraude y muestra qué fragmentos recupera para consultas típicas.
"use strict";
const { Politica } = require("../lib/politica");
(async () => {
  const p = new Politica();
  const t0 = Date.now();
  await p.indexar();
  console.log(`Indexados ${p.fragmentos.length} fragmentos en ${Date.now() - t0} ms · workspace ${p.workspace}`);
  for (const q of [
    "pide datos sensibles. Dígame el código de verificación que le llegó",
    "dominio parecido. Verifique su cuenta en https://bancodemo-pa.app",
    "pago terceros urgencia. Pague por Yappy al 6380-9726 hoy mismo",
    "qué hacer si ya compartí mi clave",
  ]) {
    const t1 = Date.now();
    const r = await p.buscar(q, 3);
    console.log(`\n? ${q}  (${Date.now() - t1} ms)`);
    for (const f of r)
      console.log(`  ${typeof f.score === "number" ? f.score.toFixed(3) : "-"}  ${f.texto.slice(0, 140)}`);
  }
  await p.descargar();
  process.exit(0);
})().catch((e) => {
  console.error("✖", e && e.stack ? e.stack : e);
  process.exit(1);
});
