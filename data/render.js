// Renderiza cada data/html/*.html a data/capturas/*.png con Electron, sin navegador externo.
// Ventana de 390x844 px CSS; en pantalla retina la captura sale a 780x1688, tamaño de teléfono real.
// Uso: npx electron data/render.js [máximo]     (el máximo sirve para probar con pocas)
"use strict";
const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

app.disableHardwareAcceleration();
console.log("render: arrancando electron", process.versions.electron);
app.whenReady().then(async () => {
  console.log("render: app lista");
  const dir = path.join(__dirname, "html");
  const out = path.join(__dirname, "capturas");
  fs.mkdirSync(out, { recursive: true });
  const max = Number(process.argv[2]) || Infinity;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".html")).sort().slice(0, max);
  const win = new BrowserWindow({
    show: false, width: 390, height: 844,
    webPreferences: { offscreen: true, sandbox: true, contextIsolation: true, nodeIntegration: false },
  });
  let n = 0;
  console.log(`render: ${files.length} archivos, ventana creada`);
  for (const f of files) {
    await win.loadFile(path.join(dir, f));
    // Electron recuerda el zoom por origen entre ejecuciones: se fija a 1 siempre, o la captura sale cortada.
    win.webContents.setZoomFactor(1);
    await new Promise((r) => setTimeout(r, 250));
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(out, f.replace(/\.html$/, ".png")), img.toPNG());
    n += 1;
    if (n % 20 === 0) console.log(`${n}/${files.length}`);
  }
  console.log(`Listas ${n} capturas en ${out}`);
  app.quit();
}).catch((e) => { console.error(e); app.exit(1); });
