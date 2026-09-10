// Registro de rendimiento estructurado: una línea JSON por llamada al modelo. Entregable del reto Psy.
"use strict";
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const RUTA = process.env.PERF_LOG || path.join(__dirname, "..", "eval", "perf.jsonl");

function hardware() {
  const cpu = (os.cpus()[0] || {}).model || "desconocido";
  return { cpu, ram_gb: Math.round(os.totalmem() / 1073741824), plataforma: `${os.platform()} ${os.release()}`, arch: os.arch() };
}

function registrar(reg) {
  const linea = { ts: new Date().toISOString(), hardware: hardware(), ...reg };
  try { fs.mkdirSync(path.dirname(RUTA), { recursive: true }); fs.appendFileSync(RUTA, JSON.stringify(linea) + "\n"); } catch { /* el registro nunca rompe la app */ }
  return linea;
}

module.exports = { registrar, hardware, RUTA };
