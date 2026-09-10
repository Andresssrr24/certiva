// Importa un modelo del catálogo desde un archivo local o una URL HTTP cuando el registro P2P no responde.
// El SDK valida los bytes contra el checksum del catálogo antes de usarlos.
// Uso: node scripts/importar-modelo.js QWEN3_4B_INST_Q4_K_M ~/.qvac/descargas/Qwen3-4B-Q4_K_M.gguf
"use strict";
const path = require("node:path");
const modelos = require("../lib/modelos");

(async () => {
  const [constName, fuente] = process.argv.slice(2);
  if (!constName || !fuente) throw new Error("Uso: node scripts/importar-modelo.js <CONSTANTE> <ruta local o URL>");
  const S = await modelos.sdk();
  const c = S[constName];
  if (!c) throw new Error(`La constante ${constName} no existe en el SDK instalado`);
  const src = /^https?:\/\//.test(fuente) ? fuente : path.resolve(fuente.replace(/^~/, require("node:os").homedir()));
  console.log(`▸ Importando ${constName} desde ${src}`);
  let u = -10;
  const t0 = Date.now();
  const id = await S.loadModel({
    modelSrc: c.src || c,
    modelType: c.engine,
    fallbackSrc: src,
    onProgress: (p) => {
      if (p && typeof p.percentage === "number" && p.percentage - u >= 10) {
        u = p.percentage;
        console.log(`  ${p.percentage.toFixed(0)}%`);
      }
    },
  });
  console.log(`▸ Cargado y validado en ${Math.round((Date.now() - t0) / 1000)}s. Descargando de memoria.`);
  await S.unloadModel({ modelId: id, clearStorage: false });
  process.exit(0);
})().catch((e) => {
  console.error("✖", e && e.message ? e.message : e);
  process.exit(1);
});
