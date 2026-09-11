// Proceso principal de Electron. Es el dueño del SDK y del sistema de archivos; la interfaz solo
// habla por IPC. Patrón tomado de qvac-invoice-manager-demo (Apache-2.0, QVAC by Tether) y recortado.
"use strict";
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { Motor } = require("./lib/analizar");
const { Llamada } = require("./lib/llamada");
const modelos = require("./lib/modelos");
const reglas = require("./lib/reglas");
const perf = require("./lib/perf");
const red = require("./lib/red");
const { fork } = require("node:child_process");
const { PilotCases } = require("./lib/casos-piloto");

app.setName("Certiva");
// Conservar los reportes existentes tras el cambio de nombre.
app.setPath("userData", path.join(app.getPath("appData"), "Certiva"));
let caseStore;
function cases() {
  if (!caseStore) caseStore = new PilotCases(path.join(app.getPath("userData"), "casos-piloto.json"));
  return caseStore;
}
ipcMain.handle("casos-listar", () => cases().list());
ipcMain.handle("casos-crear", (_event, input) => cases().create(input));
ipcMain.handle("casos-accion", (_event, { id, action }) => cases().act(id, action));
// Dos apps QVAC a la vez se quedan colgadas en el worker compartido de ~/.qvac. El candado es obligatorio.
if (!app.requestSingleInstanceLock()) app.exit(0);

let win = null;
let pilotWindow = null;
ipcMain.handle("consola-piloto-abrir", async () => {
  if (pilotWindow && !pilotWindow.isDestroyed()) {
    pilotWindow.show();
    pilotWindow.focus();
    return true;
  }
  pilotWindow = new BrowserWindow({
    width: 1240,
    height: 850,
    title: "Certiva · Reportes de la APK",
    backgroundColor: "#f4f7fc",
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  const view = pilotWindow;
  view.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  view.webContents.on("will-navigate", (event, url) => {
    if (new URL(url).origin !== "http://127.0.0.1:4320") event.preventDefault();
  });
  view.on("closed", () => {
    if (pilotWindow === view) pilotWindow = null;
  });
  try {
    await view.loadURL("http://127.0.0.1:4320");
    return true;
  } catch {
    view.close();
    throw new Error("Inicia el servidor del piloto en el puerto 4320 para ver los reportes de la APK.");
  }
});
let ocupado = false;
const motor = new Motor();
const llamada = new Llamada({ motor });
let llamadaEnCurso = false;
const historial = []; // veredictos de esta sesión, en memoria: el mensaje nunca se guarda en disco
let reportes = []; // indicadores reportados por el usuario (hash, tipo, ts). Solo hashes, nunca el mensaje.

// ---------------------------------------------------------------- pares (proceso hijo)
let pares = null;
let paresEstado = { nodo: null, pares: 0, indicadores: 0 };
const paresLog = [];
const indicadoresPares = new Map(); // "tipo:hash" -> { tipo, hash, ts, nodo, vecinos }
function arrancarPares() {
  if (process.env.PARES !== "0") {
    try {
      pares = fork(path.join(__dirname, "scripts", "pares-worker.js"), [], {
        env: { ...process.env, PARES_NODO: process.env.PARES_NODO || "" },
        silent: true,
      });
    } catch (e) {
      paresLog.push(`no arrancó: ${e.message}`);
      return;
    }
    pares.on("message", (m) => {
      if (!m) return;
      if (m.tipo === "estado") {
        paresEstado = m.estado;
        enviar("pares-estado", paresEstado);
      }
      if (m.tipo === "log") {
        paresLog.push(`${new Date().toLocaleTimeString("es-PA")} ${m.linea}`);
        if (paresLog.length > 200) paresLog.shift();
        enviar("pares-log", m.linea);
      }
      if (m.tipo === "indicador" && m.ind) {
        indicadoresPares.set(`${m.ind.tipo}:${m.ind.hash}`, m.ind);
        reportes.push({
          tipo: m.ind.tipo,
          hash: m.ind.hash,
          ts: m.ind.ts || Date.now(),
          origen: `par ${String(m.ind.nodo || "").slice(0, 6)}`,
        });
        guardarReportes();
        enviar("pares-indicador", m.ind);
      }
    });
    pares.on("exit", () => {
      pares = null;
      paresEstado = { ...paresEstado, pares: 0 };
      enviar("pares-estado", paresEstado);
    });
  }
}
function paresPid() {
  return pares && pares.pid ? [pares.pid] : [];
}
function hashInd(v) {
  return require("node:crypto").createHash("sha256").update(String(v)).digest("hex").slice(0, 16);
}
// Indicadores de una captura, para saber si otros clientes ya reportaron el mismo remitente, número o dominio.
function indicadoresDe(captura) {
  const out = [];
  for (const enlace of captura.enlaces || []) {
    const d = reglas.dominioDe(enlace);
    if (d) out.push({ tipo: "dominio", hash: hashInd(d), valor: d });
  }
  for (const t of captura.telefonos || [])
    out.push({ tipo: "numero", hash: hashInd(String(t).replace(/\D/g, "")), valor: t });
  if (captura.remitente)
    out.push({ tipo: "remitente", hash: hashInd(String(captura.remitente).toLowerCase()), valor: captura.remitente });
  return out;
}
function vecinosDe(captura) {
  return indicadoresDe(captura)
    .map((i) => ({
      ...i,
      vecinos: indicadoresPares.has(`${i.tipo}:${i.hash}`)
        ? indicadoresPares.get(`${i.tipo}:${i.hash}`).vecinos || 1
        : 0,
    }))
    .filter((i) => i.vecinos > 0);
}

function rutaReportes() {
  return path.join(app.getPath("userData"), "reportes.json");
}
function cargarReportes() {
  try {
    reportes = JSON.parse(fs.readFileSync(rutaReportes(), "utf8"));
  } catch {
    reportes = [];
  }
}
function guardarReportes() {
  try {
    fs.mkdirSync(path.dirname(rutaReportes()), { recursive: true });
    fs.writeFileSync(rutaReportes(), JSON.stringify(reportes, null, 2));
  } catch {
    /* nunca rompe la app */
  }
}

function enviar(canal, carga) {
  if (win && !win.isDestroyed()) win.webContents.send(canal, carga);
}
motor.onProgress = (p) => enviar("progreso-modelo", p);

function crearVentana() {
  win = new BrowserWindow({
    width: 1380,
    height: 920,
    minWidth: 900,
    minHeight: 620,
    backgroundColor: "#f4f7fc",
    title: "Certiva · Tu aliado contra el fraude",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.loadFile(path.join(__dirname, "renderer", "index.html"));
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (e, url) => {
    if (url !== win.webContents.getURL()) e.preventDefault();
  });
}

ipcMain.handle("estado", async () => ({
  ocupado,
  pares: paresEstado,
  banco: motor.banco,
  modelos: await modelos.catalogo().catch(() => null),
  historial,
  reportes,
  hardware: perf.hardware(),
  sdk: (() => {
    try {
      return require("@qvac/sdk/package").version;
    } catch {
      return "?";
    }
  })(),
}));

ipcMain.handle("catalogo", () => modelos.catalogo());

ipcMain.handle("descargar-modelo", async (_e, { grupo, key }) => {
  const entrada = modelos.entrada(grupo, key);
  await modelos.descargar(entrada, (p) => enviar("progreso-descarga", p));
  return modelos.catalogo();
});

ipcMain.handle("elegir-captura", async () => {
  const r = await dialog.showOpenDialog(win, {
    title: "Elige una captura de pantalla",
    properties: ["openFile"],
    filters: [{ name: "Imágenes", extensions: ["png", "jpg", "jpeg", "webp"] }],
  });
  return r.canceled ? null : r.filePaths[0];
});

ipcMain.handle("capturas-demo", () => {
  const dir = path.join(__dirname, "data", "capturas");
  try {
    const ejemplos = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "mensajes.json"), "utf8"));
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".png"))
      .sort()
      .map((f) => {
        const id = f.replace(/\.png$/, "");
        const mensaje = ejemplos.find((e) => e.id === id);
        return {
          id,
          ruta: path.join(dir, f),
          mensaje: mensaje
            ? { canal: mensaje.canal, remitente: mensaje.remitente, texto: mensaje.texto, hora: mensaje.hora }
            : null,
        };
      });
  } catch {
    return [];
  }
});

// Evidencia optativa de una captura sintética: nunca guarda mensajes de uso normal.
const sesionEvidencia = `${new Date().toISOString().replace(/[:.]/g, "-")}-${process.pid}`;
let ejecucionEvidencia = 0;
function guardarEvidenciaDemo(nombre, resultado, ejecucion = "inicio") {
  if (!process.env.DEMO_EVIDENCIA_DIR || !process.env.DEMO_AUTO) return;
  const dir = path.resolve(process.env.DEMO_EVIDENCIA_DIR, sesionEvidencia, ejecucion);
  setTimeout(async () => {
    try {
      fs.mkdirSync(dir, { recursive: true });
      const imagen = await win.webContents.capturePage();
      fs.writeFileSync(path.join(dir, `${nombre}.png`), imagen.toPNG());
      if (resultado)
        fs.writeFileSync(
          path.join(dir, "resultado.json"),
          JSON.stringify(
            {
              sesionEvidencia,
              ejecucion,
              casoSintetico: process.env.DEMO_AUTO,
              fecha: new Date().toISOString(),
              electron: process.versions.electron,
              ...resultado,
            },
            null,
            2,
          ),
        );
      console.log(`Evidencia de escritorio: ${path.join(dir, nombre)}`);
    } catch (e) {
      console.error("No se pudo guardar evidencia:", e.message);
    }
  }, 600);
}

ipcMain.handle("analizar", async (_e, ruta) => {
  if (ocupado) throw new Error("Ya hay un análisis en curso");
  if (!ruta || !fs.existsSync(ruta)) throw new Error("No encuentro la captura");
  ocupado = true;
  enviar("ocupado", true);
  try {
    const esDemo = ruta === path.join(__dirname, "data", "capturas", `${process.env.DEMO_AUTO}.png`);
    const ejecucion = `analisis-${++ejecucionEvidencia}`;
    if (esDemo) guardarEvidenciaDemo("02-analizando", null, ejecucion);
    const r = await motor.analizar(ruta, { onEtapa: (e) => enviar("analisis-etapa", e) });
    const item = { ruta, ts: Date.now(), ...r, vecinos: r.ok ? vecinosDe(r.captura) : [] };
    historial.unshift(item);
    if (esDemo) guardarEvidenciaDemo("03-resultado", item, ejecucion);
    return item;
  } finally {
    ocupado = false;
    enviar("ocupado", false);
  }
});

// Reportar: solo viaja el hash del indicador, nunca el mensaje. Hoy queda en memoria; la fase 3 lo publica por pares.
ipcMain.handle("reportar", (_e, { captura }) => {
  const crypto = require("node:crypto");
  const nuevos = [];
  for (const enlace of captura.enlaces || []) {
    const d = reglas.dominioDe(enlace);
    if (d)
      nuevos.push({
        tipo: "dominio",
        hash: crypto.createHash("sha256").update(d).digest("hex").slice(0, 16),
        ts: Date.now(),
        origen: "local",
      });
  }
  for (const t of captura.telefonos || [])
    nuevos.push({
      tipo: "numero",
      hash: crypto.createHash("sha256").update(String(t).replace(/\D/g, "")).digest("hex").slice(0, 16),
      ts: Date.now(),
      origen: "local",
    });
  if (captura.remitente)
    nuevos.push({
      tipo: "remitente",
      hash: crypto.createHash("sha256").update(String(captura.remitente).toLowerCase()).digest("hex").slice(0, 16),
      ts: Date.now(),
      origen: "local",
    });
  reportes.push(...nuevos);
  guardarReportes();
  if (pares) for (const n of nuevos) pares.send({ tipo: "publicar", ind: { tipo: n.tipo, hash: n.hash, ts: n.ts } });
  return reportes;
});

ipcMain.handle("vecinos", (_e, captura) => (captura ? vecinosDe(captura) : []));

ipcMain.handle("pares", () => ({ estado: paresEstado, log: paresLog.slice(-30), pid: paresPid()[0] || null }));

// ---------------------------------------------------------------- modo llamada
ipcMain.handle("llamada-demo", () => path.join(__dirname, "data", "audio", "llamada-vishing.wav"));

ipcMain.handle("elegir-audio", async () => {
  const r = await dialog.showOpenDialog(win, {
    title: "Elige una grabación de llamada",
    properties: ["openFile"],
    filters: [{ name: "Audio", extensions: ["wav", "m4a", "mp3", "aiff", "caf"] }],
  });
  return r.canceled ? null : r.filePaths[0];
});

// Procesa el audio por lotes y va avisando al renderer; devuelve al final la transcripción y el resumen.
ipcMain.handle("llamada-iniciar", async (_e, ruta) => {
  if (ocupado || llamadaEnCurso) throw new Error("Ya hay un análisis en curso");
  if (!ruta || !fs.existsSync(ruta)) throw new Error("No encuentro el audio");
  llamadaEnCurso = true;
  ocupado = true;
  enviar("ocupado", true);
  try {
    const r = await llamada.procesarArchivo(ruta, {
      onSegmento: (s) => enviar("llamada-segmento", s),
      onAlerta: (a) => enviar("llamada-alerta", a),
    });
    enviar("llamada-transcrita", { duracion_s: r.duracion_s, alertas: r.alertas.length });
    const resumen = await llamada.resumir(r);
    const salida = { ...r, resumen, ts: Date.now() };
    enviar("llamada-fin", salida);
    return salida;
  } finally {
    llamadaEnCurso = false;
    ocupado = false;
    enviar("ocupado", false);
  }
});

ipcMain.handle("llamada-detener", () => {
  llamada.detener = true;
  return true;
});

// Conexiones salientes del árbol de procesos: la prueba de que nada va a la nube.
ipcMain.handle("red", () => red.conexiones(process.pid, { pares: paresPid() }));

// Para verificar la interfaz sin manos: con DEMO_AUTO=<id> el renderer pide la captura al iniciar y la analiza;
// con DEMO_CAPTURA=<ruta> se guarda una imagen de la ventana pasados DEMO_ESPERA_MS.
ipcMain.handle("demo-auto", () => ({
  captura: process.env.DEMO_AUTO ? path.join(__dirname, "data", "capturas", `${process.env.DEMO_AUTO}.png`) : null,
  llamada: process.env.DEMO_LLAMADA ? path.join(__dirname, "data", "audio", "llamada-vishing.wav") : null,
}));
async function demoAutomatica() {
  if (!process.env.DEMO_CAPTURA || !win) return;
  const salida = process.env.DEMO_CAPTURA;
  if (salida) {
    await new Promise((r) => setTimeout(r, Number(process.env.DEMO_ESPERA_MS || 25000)));
    try {
      const img = await win.webContents.capturePage();
      fs.writeFileSync(salida, img.toPNG());
      console.log("captura de la ventana en", salida);
    } catch (e) {
      console.error("no se pudo capturar", e.message);
    }
    if (process.env.DEMO_SALIR) {
      await motor.descargarTodo();
      app.exit(0);
    }
  }
}

ipcMain.handle("descargar-modelos-memoria", async () => {
  await motor.descargarTodo();
  return true;
});

app.whenReady().then(() => {
  cargarReportes();
  arrancarPares();
  crearVentana();
  win.webContents.once("did-finish-load", () => {
    guardarEvidenciaDemo("01-inicio");
    demoAutomatica().catch(() => {});
  });
});
app.on("window-all-closed", async () => {
  if (pares) {
    try {
      pares.send({ tipo: "cerrar" });
    } catch {
      /* */
    }
  }
  try {
    await llamada.descargar();
    await motor.descargarTodo();
  } catch {
    /* */
  }
  app.quit();
});
