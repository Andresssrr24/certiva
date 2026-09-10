// Radar del banco sin modelos: se une a los pares y muestra los indicadores que llegan. Para la segunda laptop de la demo.
// Uso: node scripts/radar.js [--puerto 4411] [--directo host:puerto] [--sin-swarm]
"use strict";
const { Pares } = require("../lib/pares");
const args = process.argv.slice(2);
const val = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : null;
};
const conteo = new Map();
const pares = new Pares({
  onIndicador: (ind) => {
    conteo.set(ind.tipo, (conteo.get(ind.tipo) || 0) + 1);
    console.log(
      `${new Date().toLocaleTimeString("es-PA")}  ${ind.tipo.padEnd(9)} ${ind.hash}  de ${ind.nodo}  vecinos=${ind.vecinos}  · total ${[...conteo].map(([k, v]) => `${k}:${v}`).join(" ")}`,
    );
  },
  onEstado: (e) => console.log(`[estado] nodo ${e.nodo} · pares ${e.pares} · indicadores ${e.indicadores}`),
  onLog: (l) => console.log(`[pares] ${l}`),
});
(async () => {
  const puerto = val("--puerto");
  if (puerto) pares.escucharDirecto(Number(puerto));
  const directo = val("--directo");
  if (directo) pares.conectarDirecto(directo);
  if (!args.includes("--sin-swarm")) await pares.iniciarSwarm();
  // --emitir tipo:valor publica un indicador de prueba (se hashea aquí) en cuanto haya un par conectado.
  const emitir = val("--emitir");
  if (emitir) {
    const [tipo, ...resto] = emitir.split(":");
    const valor = resto.join(":");
    const norm = tipo === "numero" ? valor.replace(/\D/g, "") : valor.toLowerCase();
    const hash = require("node:crypto").createHash("sha256").update(norm).digest("hex").slice(0, 16);
    const intentar = () => {
      if (pares.conexiones.size) {
        pares.publicar({ tipo, hash, ts: Date.now() });
        console.log(`[radar] emitido ${tipo} ${hash} (${valor})`);
      } else setTimeout(intentar, 500);
    };
    intentar();
  }
  console.log("Radar listo. Esperando indicadores de los pares… (Ctrl+C para salir)");
})().catch((e) => {
  console.error("✖", e.message);
  process.exit(1);
});
process.on("SIGINT", () => pares.cerrar().then(() => process.exit(0)));
