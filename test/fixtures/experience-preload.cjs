const { contextBridge, ipcRenderer } = require("electron");
const api = {
  on: (name, cb) => {
    const handler = (_event, data) => cb(data);
    ipcRenderer.on(name, handler);
    return () => ipcRenderer.removeListener(name, handler);
  },
};
for (const name of [
  "estado",
  "capturasDemo",
  "casos",
  "casoCrear",
  "casoAccion",
  "analizar",
  "analizarMensaje",
  "reportar",
  "pares",
  "red",
  "demoAuto",
])
  api[name] = (...args) => ipcRenderer.invoke("test-api", name, args);
contextBridge.exposeInMainWorld("escudo", api);
