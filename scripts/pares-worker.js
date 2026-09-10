// Proceso hijo de la app: mantiene la capa de pares y habla con el proceso principal por IPC de Node.
// Variables: PARES_SWARM=0 desactiva Hyperswarm; PARES_PUERTO=4411 escucha directo; PARES_DIRECTO=host:puerto conecta directo.
"use strict";
const { Pares } = require("../lib/pares");

const pares = new Pares({
  nodo: process.env.PARES_NODO,
  onIndicador: (ind) => process.send && process.send({ tipo: "indicador", ind }),
  onEstado: (e) => process.send && process.send({ tipo: "estado", estado: e }),
  onLog: (l) => process.send && process.send({ tipo: "log", linea: l }),
});
process.on("message", (m) => {
  if (!m) return;
  if (m.tipo === "publicar" && m.ind) pares.publicar(m.ind);
  if (m.tipo === "cerrar") pares.cerrar().then(() => process.exit(0));
});
(async () => {
  if (process.env.PARES_PUERTO) pares.escucharDirecto(Number(process.env.PARES_PUERTO));
  if (process.env.PARES_DIRECTO) pares.conectarDirecto(process.env.PARES_DIRECTO);
  if (process.env.PARES_SWARM !== "0") await pares.iniciarSwarm();
  process.send && process.send({ tipo: "estado", estado: pares.estado() });
})().catch((e) => {
  process.send && process.send({ tipo: "log", linea: `error: ${e.message}` });
});
