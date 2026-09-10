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
  for (const e of estado) console.log(`  ${e.disponible ? "✓" : "✗"} ${e.label.padEnd(28)} ${e.constName.padEnd(46)} ${e.disponible ? gb(e.bytes) : "NO EXISTE"} ${e.enCache ? "(en caché)" : ""}`);
  let total = 0;
  for (const e of quiero) {
    const s = estado.find((x) => x.key === e.key);
    if (!s || !s.disponible) { console.log(`\n✗ ${e.label}: no disponible, se omite`); continue; }
    if (s.enCache) { console.log(`\n✓ ${e.label} ya está en caché`); continue; }
    console.log(`\n▸ Descargando ${e.label} (${gb(s.bytes)})`);
    let ultimo = -10;
    const t0 = Date.now();
    await modelos.descargar(e, (p) => { if (p.porcentaje - ultimo >= 5) { ultimo = p.porcentaje; process.stdout.write(`  ${p.porcentaje.toFixed(0)}% archivo ${p.archivo}/${p.archivos}\n`); } });
    total += s.bytes;
    console.log(`  listo en ${Math.round((Date.now() - t0) / 1000)}s`);
  }
  console.log(`\nDescargado ${gb(total)} nuevos. Caché: ${modelos.CACHE_DIR}`);
  process.exit(0);
})().catch((e) => { console.error("✖", e && e.message ? e.message : e); process.exit(1); });
