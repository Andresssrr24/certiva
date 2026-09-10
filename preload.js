// Único puente entre la interfaz y el proceso principal: lista cerrada de canales.
"use strict";
const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("escudo", {
  estado: () => ipcRenderer.invoke("estado"),
  catalogo: () => ipcRenderer.invoke("catalogo"),
  descargarModelo: (grupo, key) => ipcRenderer.invoke("descargar-modelo", { grupo, key }),
  elegirCaptura: () => ipcRenderer.invoke("elegir-captura"),
  capturasDemo: () => ipcRenderer.invoke("capturas-demo"),
  analizar: (ruta) => ipcRenderer.invoke("analizar", ruta),
  reportar: (captura) => ipcRenderer.invoke("reportar", { captura }),
  liberarModelos: () => ipcRenderer.invoke("descargar-modelos-memoria"),
  red: () => ipcRenderer.invoke("red"),
  demoAuto: () => ipcRenderer.invoke("demo-auto"),
  llamadaDemo: () => ipcRenderer.invoke("llamada-demo"),
  elegirAudio: () => ipcRenderer.invoke("elegir-audio"),
  llamadaIniciar: (ruta) => ipcRenderer.invoke("llamada-iniciar", ruta),
  llamadaDetener: () => ipcRenderer.invoke("llamada-detener"),
  rutaDeArchivo: (file) => {
    try {
      return webUtils.getPathForFile(file);
    } catch {
      return null;
    }
  },
  on: (canal, cb) => {
    const permitidos = [
      "ocupado",
      "progreso-modelo",
      "progreso-descarga",
      "llamada-segmento",
      "llamada-alerta",
      "llamada-transcrita",
      "llamada-fin",
    ];
    if (!permitidos.includes(canal)) return () => {};
    const h = (_e, carga) => cb(carga);
    ipcRenderer.on(canal, h);
    return () => ipcRenderer.removeListener(canal, h);
  },
});
