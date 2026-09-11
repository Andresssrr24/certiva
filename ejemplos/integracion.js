// El motor sin interfaz: entra una captura, salen el veredicto en JSON y los indicadores como hashes.
// Esto es lo que un banco, una cooperativa o una billetera embebe; la app de escritorio es solo un anfitrión.
// Uso: node ejemplos/integracion.js [ruta.png]
"use strict";
const crypto = require("node:crypto");
const { Motor } = require("../lib/analizar");
const { dominioDe } = require("../lib/reglas");

const hash = (v) => crypto.createHash("sha256").update(String(v)).digest("hex").slice(0, 16);

(async () => {
  const ruta = process.argv[2] || "data/capturas/fraude-bloqueo_enlace-01.png";
  const motor = new Motor(); // banco: data/banco-demo.json; para otro emisor, new Motor({ banco: otraFicha })
  const r = await motor.analizar(ruta);
  const indicadores = r.ok
    ? [
        ...(r.captura.enlaces || []).map((e) => ({ tipo: "dominio", hash: hash(dominioDe(e)) })),
        ...(r.captura.telefonos || []).map((t) => ({ tipo: "numero", hash: hash(String(t).replace(/\D/g, "")) })),
      ]
    : [];
  // Lo que cruza la frontera hacia el banco: nunca el mensaje, solo esto.
  console.log(
    JSON.stringify(
      {
        veredicto: r.veredicto,
        senales: r.senales,
        indicadores,
        coaccion_reciente: r.ok && r.veredicto && r.veredicto.veredicto === "fraude",
        tiempos: r.tiempos,
      },
      null,
      2,
    ),
  );
  await motor.descargarTodo();
  process.exit(0);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
