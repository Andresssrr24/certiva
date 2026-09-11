// Fechas, tamaños y tiempos escritos como los diría una persona, no como los guarda la máquina.
"use strict";

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function dosDigitos(n) {
  return n < 10 ? `0${n}` : String(n);
}

function hora(ts) {
  const d = new Date(ts);
  const h = d.getHours();
  const am = h < 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${dosDigitos(d.getMinutes())} ${am ? "a. m." : "p. m."}`;
}

function mismoDia(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// «Hoy», «Ayer», «martes» dentro de la semana, y la fecha completa más atrás.
function diaEtiqueta(ts) {
  const d = new Date(ts);
  const hoy = new Date();
  const ayer = new Date(hoy.getTime() - 86400000);
  if (mismoDia(d, hoy)) return "Hoy";
  if (mismoDia(d, ayer)) return "Ayer";
  if (hoy.getTime() - d.getTime() < 6 * 86400000) return DIAS[d.getDay()];
  return `${d.getDate()} de ${MESES[d.getMonth()]}`;
}

function megas(bytes) {
  if (!bytes) return "—";
  return `${Math.round(bytes / 1e6)} MB`;
}

// Los tiempos del motor: por debajo de un segundo en milisegundos, por encima en segundos con un decimal.
function duracion(ms) {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${Math.max(1, Math.round(ms))} ms`;
  return `${(ms / 1000).toFixed(1)} s`.replace(".", ",");
}

function recorte(texto, largo = 96) {
  const t = String(texto || "")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > largo ? `${t.slice(0, largo - 1)}…` : t;
}

const CANAL = { sms: "Mensaje de texto", whatsapp: "WhatsApp", correo: "Correo", llamada: "Llamada" };

function canalNombre(c) {
  return CANAL[c] || "Mensaje";
}

module.exports = { hora, diaEtiqueta, megas, duracion, recorte, canalNombre };
