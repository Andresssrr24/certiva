// Lo que la app recuerda entre sesiones: las revisiones hechas y si ya se vio la bienvenida.
// Un solo archivo JSON en la carpeta privada de la app. No sale del teléfono y se borra al desinstalar.
"use strict";
const { File, Paths } = require("expo-file-system");

const ARCHIVO = "certiva-estado.json";
const MAXIMO = 120; // revisiones guardadas; las más viejas se caen solas

let estado = { version: 1, vistoInicio: false, revisiones: [] };
let cargado = false;

function archivo() {
  return new File(Paths.document, ARCHIVO);
}

function escribir() {
  try {
    archivo().write(JSON.stringify(estado));
  } catch (e) {
    console.warn("Certiva: no pude guardar el estado", e);
  }
}

async function cargar() {
  if (cargado) return estado;
  cargado = true;
  try {
    const f = archivo();
    if (f.exists) {
      const leido = JSON.parse(await f.text());
      if (leido && Array.isArray(leido.revisiones)) estado = { ...estado, ...leido };
    }
  } catch (e) {
    console.warn("Certiva: estado ilegible, empiezo de cero", e);
  }
  return estado;
}

function revisiones() {
  return estado.revisiones;
}

function inicioVisto() {
  return !!estado.vistoInicio;
}

function marcarInicioVisto() {
  estado = { ...estado, vistoInicio: true };
  escribir();
  return estado;
}

// Guarda una revisión recortando lo que no hace falta: el veredicto, las señales y un extracto del texto.
function guardarRevision(r) {
  const item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: Date.now(),
    veredicto: r.veredicto || "no_legible",
    senales: (r.senales || []).map((s) => ({ tipo: s.tipo, evidencia: s.evidencia })),
    texto: String(r.captura?.texto || r.crudo || "").slice(0, 1200),
    canal: r.captura?.canal || null,
    remitente: r.captura?.remitente || null,
    lector: r.lector || "texto",
    ms: r.ms ?? null,
    ttft: r.ttft ?? null,
    msVision: r.msVision ?? null,
    lecturaDudosa: !!r.lecturaDudosa,
  };
  estado = { ...estado, revisiones: [item, ...estado.revisiones].slice(0, MAXIMO) };
  escribir();
  return item;
}

function borrarRevision(id) {
  estado = { ...estado, revisiones: estado.revisiones.filter((r) => r.id !== id) };
  escribir();
  return estado;
}

function vaciarHistorial() {
  estado = { ...estado, revisiones: [] };
  escribir();
  return estado;
}

module.exports = {
  cargar,
  revisiones,
  inicioVisto,
  marcarInicioVisto,
  guardarRevision,
  borrarRevision,
  vaciarHistorial,
};
