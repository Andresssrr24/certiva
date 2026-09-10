// Proceso principal de Electron. Es el dueño del SDK y del sistema de archivos; la interfaz solo
// habla por IPC. Patrón tomado de qvac-invoice-manager-demo (Apache-2.0, QVAC by Tether) y recortado.
"use strict";
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { Motor } = require("./lib/analizar");
const modelos = require("./lib/modelos");
const reglas = require("./lib/reglas");
const perf = require("./lib/perf");

app.setName("Anti-fraude QVAC");
// Dos apps QVAC a la vez se quedan colgadas en el worker compartido de ~/.qvac. El candado es obligatorio.
if (!app.requestSingleInstanceLock()) app.exit(0);

let win = null;
let ocupado = false;
const motor = new Motor();
const historial = []; // veredictos de esta sesión, en memoria: nada se guarda en disco
const reportes = [];  // indicadores reportados por el usuario (hash, tipo, ts). Base del modo banco.

function enviar(canal, carga) { if (win && !win.isDestroyed()) win.webContents.send(canal, carga); }
motor.onProgress = (p) => enviar("progreso-modelo", p);

function crearVentana() {
  win = new BrowserWindow({
    width: 1180, height: 820, minWidth: 900, minHeight: 620,
    backgroundColor: "#0f1514",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.loadFile(path.join(__dirname, "renderer", "index.html"));
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (e, url) => { if (url !== win.webContents.getURL()) e.preventDefault(); });
}

ipcMain.handle("estado", async () => ({
  ocupado, banco: motor.banco, historial, reportes,
  hardware: perf.hardware(), sdk: (() => { try { return require("@qvac/sdk/package").version; } catch { return "?"; } })(),
}));

ipcMain.handle("catalogo", () => modelos.catalogo());

ipcMain.handle("descargar-modelo", async (_e, { grupo, key }) => {
  const entrada = modelos.entrada(grupo, key);
  await modelos.descargar(entrada, (p) => enviar("progreso-descarga", p));
  return modelos.catalogo();
});

ipcMain.handle("elegir-captura", async () => {
  const r = await dialog.showOpenDialog(win, { title: "Elige una captura de pantalla", properties: ["openFile"], filters: [{ name: "Imágenes", extensions: ["png", "jpg", "jpeg", "webp"] }] });
  return r.canceled ? null : r.filePaths[0];
});

ipcMain.handle("capturas-demo", () => {
  const dir = path.join(__dirname, "data", "capturas");
  try { return fs.readdirSync(dir).filter((f) => f.endsWith(".png")).sort().map((f) => ({ id: f.replace(/\.png$/, ""), ruta: path.join(dir, f) })); } catch { return []; }
});

ipcMain.handle("analizar", async (_e, ruta) => {
  if (ocupado) throw new Error("Ya hay un análisis en curso");
  if (!ruta || !fs.existsSync(ruta)) throw new Error("No encuentro la captura");
  ocupado = true; enviar("ocupado", true);
  try {
    const r = await motor.analizar(ruta);
    const item = { ruta, ts: Date.now(), ...r };
    historial.unshift(item);
    return item;
  } finally { ocupado = false; enviar("ocupado", false); }
});

// Reportar: solo viaja el hash del indicador, nunca el mensaje. Hoy queda en memoria; la fase 3 lo publica por pares.
ipcMain.handle("reportar", (_e, { captura }) => {
  const crypto = require("node:crypto");
  const nuevos = [];
  for (const enlace of captura.enlaces || []) { const d = reglas.dominioDe(enlace); if (d) nuevos.push({ tipo: "dominio", hash: crypto.createHash("sha256").update(d).digest("hex").slice(0, 16), ts: Date.now(), origen: "local" }); }
  for (const t of captura.telefonos || []) nuevos.push({ tipo: "numero", hash: crypto.createHash("sha256").update(String(t).replace(/\D/g, "")).digest("hex").slice(0, 16), ts: Date.now(), origen: "local" });
  if (captura.remitente) nuevos.push({ tipo: "remitente", hash: crypto.createHash("sha256").update(String(captura.remitente).toLowerCase()).digest("hex").slice(0, 16), ts: Date.now(), origen: "local" });
  reportes.push(...nuevos);
  return reportes;
});

ipcMain.handle("descargar-modelos-memoria", async () => { await motor.descargarTodo(); return true; });

app.whenReady().then(crearVentana);
app.on("window-all-closed", async () => { try { await motor.descargarTodo(); } catch { /* */ } app.quit(); });
