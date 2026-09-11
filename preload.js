// Único puente entre la interfaz y el proceso principal: lista cerrada de canales.
"use strict";
const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("escudo", {
  estado: () => ipcRenderer.invoke("estado"),
  casos: () => ipcRenderer.invoke("casos-listar"),
  abrirConsolaPiloto: () => ipcRenderer.invoke("consola-piloto-abrir"),
  casoCrear: (input) => ipcRenderer.invoke("casos-crear", input),
  casoAccion: (id, action) => ipcRenderer.invoke("casos-accion", { id, action }),
  catalogo: () => ipcRenderer.invoke("catalogo"),
  descargarModelo: (grupo, key) => ipcRenderer.invoke("descargar-modelo", { grupo, key }),
  elegirCaptura: () => ipcRenderer.invoke("elegir-captura"),
  capturasDemo: () => ipcRenderer.invoke("capturas-demo"),
  analizar: (ruta) => ipcRenderer.invoke("analizar", ruta),
  reportar: (captura) => ipcRenderer.invoke("reportar", { captura }),
  liberarModelos: () => ipcRenderer.invoke("descargar-modelos-memoria"),
  red: () => ipcRenderer.invoke("red"),
  pares: () => ipcRenderer.invoke("pares"),
  analizarVecinos: (captura) => ipcRenderer.invoke("vecinos", captura),
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
      "analisis-etapa",
      "pares-estado",
      "pares-log",
      "pares-indicador",
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
