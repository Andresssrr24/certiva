const { contextBridge, ipcRenderer } = require("electron");
const api = { on: () => () => {} };
for (const nombre of ["estado", "capturasDemo", "casos", "pares", "red", "demoAuto", "abrirFuenteContacto"])
  api[nombre] = (...args) => ipcRenderer.invoke("contactos-test", nombre, args);
contextBridge.exposeInMainWorld("escudo", api);
