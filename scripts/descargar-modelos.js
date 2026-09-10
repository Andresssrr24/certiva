// Descarga a ~/.qvac/models los modelos por defecto sin cargarlos. Uso: node scripts/descargar-modelos.js [--respaldo]
"use strict";
const modelos = require("../lib/modelos");

(async () => {
  const conRespaldo = process.argv.includes("--respaldo");
  const cat = await modelos.catalogo();
  const quiero = [
    modelos.entrada("vision", "visionpsy-flash"),
    modelos.entrada("texto", "qwen3-4b"),
    modelos.entrada("voz", "parakeet-tdt"),
    modelos.entrada("embed", "embeddinggemma"),
    ...(conRespaldo ? [modelos.entrada("vision", "qwen3vl-2b")] : []),
  ];
  const estado = Object.values(cat).flat();
  const gb = (b) => (b / 1073741824).toFixed(2) + " GB";
  console.log("Catálogo según el SDK instalado:");
  for (const e of estado)
    console.log(
      `  ${e.disponible ? "✓" : "✗"} ${e.label.padEnd(28)} ${e.constName.padEnd(46)} ${e.disponible ? gb(e.bytes) : "NO EXISTE"} ${e.enCache ? "(en caché)" : e.parcial ? "(PARCIAL)" : ""}`,
    );
  let total = 0;
  for (const e of quiero) {
    const s = estado.find((x) => x.key === e.key);
    if (!s || !s.disponible) {
      console.log(`\n✗ ${e.label}: no disponible, se omite`);
      continue;
    }
    if (s.enCache) {
      console.log(`\n✓ ${e.label} ya está en caché`);
      continue;
    }
    if (s.parcial) {
      // Un parcial de una descarga interrumpida: se borra y se baja de nuevo, en vez de fingir que está.
      for (const id of s.archivos)
        for (const f of require("node:fs").readdirSync(modelos.CACHE_DIR))
          if (f.endsWith(id)) {
            require("node:fs").unlinkSync(require("node:path").join(modelos.CACHE_DIR, f));
            console.log(`  parcial borrado: ${f}`);
          }
    }
    console.log(`\n▸ Descargando ${e.label} (${gb(s.bytes)})`);
    let ultimo = -10;
    const t0 = Date.now();
    try {
      await modelos.descargar(e, (p) => {
        if (p.porcentaje - ultimo >= 5) {
          ultimo = p.porcentaje;
          process.stdout.write(`  ${p.porcentaje.toFixed(0)}% archivo ${p.archivo}/${p.archivos}\n`);
        }
      });
    } catch (err) {
      if (!e.fallback) throw err;
      // El registro P2P falló: se carga desde la URL HTTP de respaldo. El SDK valida el checksum del catálogo.
      console.log(
        `  registro falló (${((err && err.message) || err).toString().slice(0, 80)}...). Probando respaldo HTTP: ${e.fallback}`,
      );
      const S = await modelos.sdk();
      const args = await modelos.argsCarga(e);
      let u = -10;
      const id = await S.loadModel({
        ...args,
        fallbackSrc: e.fallback,
        onProgress: (p) => {
          if (p && typeof p.percentage === "number" && p.percentage - u >= 5) {
            u = p.percentage;
            process.stdout.write(`  ${p.percentage.toFixed(0)}% (respaldo)\n`);
          }
        },
      });
      await S.unloadModel({ modelId: id, clearStorage: false });
    }
    total += s.bytes;
    console.log(`  listo en ${Math.round((Date.now() - t0) / 1000)}s`);
  }
  console.log(`\nDescargado ${gb(total)} nuevos. Caché: ${modelos.CACHE_DIR}`);
  process.exit(0);
})().catch((e) => {
  console.error("✖", e && e.message ? e.message : e);
  process.exit(1);
});
