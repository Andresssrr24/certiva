const { contextBridge, ipcRenderer } = require("electron");
const api = { on: () => () => {} };
for (const name of [
  "estado",
  "capturasDemo",
  "casos",
  "casoCrear",
  "casoAccion",
  "analizar",
  "reportar",
  "pares",
  "red",
  "demoAuto",
])
  api[name] = (...args) => ipcRenderer.invoke("test-api", name, args);
contextBridge.exposeInMainWorld("escudo", api);
