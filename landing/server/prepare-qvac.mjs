import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const models = require('../../lib/modelos.js');
try {
  const catalog = await models.catalogo();
  for (const [group, key] of [['vision','visionpsy-flash'], ['texto','qwen3-4b']]) {
    const entry = models.entrada(group, key);
    const status = catalog[group].find(model => model.key === key);
    if (!status?.disponible) throw new Error(`${entry.label} no está disponible en el SDK instalado.`);
    if (status.enCache) { console.log(`${entry.label}: en caché.`); continue; }
    console.log(`Descargando ${entry.label} (${(status.bytes / 1073741824).toFixed(2)} GiB)…`);
    let reported = -10;
    try {
      await models.descargar(entry, progress => {
        if (progress.porcentaje >= reported + 10) {
          reported = progress.porcentaje;
          console.log(`${entry.label}: ${Math.floor(reported)}%`);
        }
      });
    } catch (error) {
      if (!entry.fallback) throw error;
      console.log(`${entry.label}: reintentando con el respaldo HTTP del proyecto.`);
      const sdk = await models.sdk();
      const id = await sdk.loadModel({ ...await models.argsCarga(entry), fallbackSrc: entry.fallback });
      await sdk.unloadModel({ modelId: id, clearStorage: false });
    }
  }
  console.log('Modelos de la landing preparados. Inicia el puente con npm run qvac.');
  process.exit(0);
} catch (error) { console.error('Preparación QVAC:', error.message); process.exit(1); }
