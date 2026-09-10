// Reglas deterministas v1. Cada regla devuelve una evidencia en texto, nunca solo un booleano.
// Trabajan sobre el JSON que produce el modelo de visión, no sobre la imagen.
"use strict";

function dominioDe(enlace) {
  const m = String(enlace)
    .trim()
    .toLowerCase()
    .match(/^(?:[a-z]+:\/\/)?([^/\s:?#]+)/);
  return m ? m[1].replace(/^www\./, "") : "";
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  return dp[a.length][b.length];
}

// Sin tildes ni mayúsculas, para que «ultimo aviso» o «Ultimo Aviso» transcritos con errores igual se reconozcan.
function normaliza(t) {
  return String(t || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Urgencia tolerante a la transcripción: frases clave con hasta un error de un carácter en las palabras largas.
const FRASES_URGENCIA = [
  "ultimo aviso",
  "ultima oportunidad",
  "hoy mismo",
  "ahora mismo",
  "de inmediato",
  "vence hoy",
  "24 horas",
  "48 horas",
  "sera bloqueada",
  "sera bloqueado",
  "sera suspendida",
  "sera suspendido",
  "sera cancelada",
  "sera cancelado",
  "sera limitada",
  "quedara suspendida",
  "quedara bloqueada",
  "evite cargos",
  "evitar cargos",
  "antes de que",
  "de lo contrario",
  "urgente",
  "para seguir usando",
  "retire la nueva",
  "actualice hoy",
  "ha sido bloqueada",
  "ha sido bloqueado",
  "ha sido suspendida",
  "cuenta bloqueada",
  "tarjeta suspendida",
  "sera desactivada",
  "en este momento",
];
function fraseDifusa(f) {
  // cada palabra de 5 letras o más admite un carácter cambiado o uno de menos; las cortas van exactas
  const palabras = f.split(" ").map((w) => {
    if (w.length < 5) return w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const variantes = [w];
    for (let i = 0; i < w.length; i++) {
      variantes.push(`${w.slice(0, i)}.${w.slice(i + 1)}`);
      variantes.push(`${w.slice(0, i)}${w.slice(i + 1)}`);
    }
    return `(?:${variantes.join("|")})`;
  });
  return palabras.join("\\s+");
}
const RE_URGENCIA_DIFUSA = new RegExp(FRASES_URGENCIA.map(fraseDifusa).join("|"), "i");

// Petición de datos tolerante a la transcripción. Un verbo de petición seguido, en 80 caracteres, de un dato que el
// banco nunca pide; o el dato seguido de «dígamelo», «léamelo» o «para activar/cancelar/verificar». Un «no» o «nunca»
// justo antes del verbo lo anula: «no lo comparta con nadie» es un consejo, no una petición.
const VERBOS_PIDE = [
  "digame",
  "digamelo",
  "deme",
  "envie",
  "envieme",
  "responda",
  "confirme",
  "indique",
  "indiqueme",
  "comparta",
  "ingrese",
  "digite",
  "proporcione",
  "necesito",
  "escriba",
  "leame",
  "leamelo",
  "dicte",
  "dicteme",
];
const DATOS_PIDE = ["clave", "contrasena", "pin", "codigo", "token", "cvv", "tarjeta", "usuario", "seis digitos"];
const RE_VERBOS_PIDE = new RegExp(`\\b(?:${VERBOS_PIDE.map(fraseDifusa).join("|")})\\b`, "gi");
const RE_DATOS_PIDE = new RegExp(`\\b(?:${DATOS_PIDE.map(fraseDifusa).join("|")})\\b`, "i");
const RE_DATO_LUEGO_VERBO = new RegExp(
  `\\b(?:${DATOS_PIDE.map(fraseDifusa).join("|")})\\b[\\s\\S]{0,60}?\\b(?:${["digamelo", "leamelo", "dictemelo", "completo"].map(fraseDifusa).join("|")}|para (?:continuar|activar|cancelar|verificar|desbloquear|confirmar))\\b`,
  "i",
);
function pideDatosDifuso(texto) {
  const t = normaliza(texto);
  RE_VERBOS_PIDE.lastIndex = 0;
  let m = RE_VERBOS_PIDE.exec(t);
  while (m) {
    const antes = t.slice(Math.max(0, m.index - 12), m.index);
    if (!/\b(no|nunca|jamas)\s*(lo|la|los|las)?\s*$/.test(antes)) {
      const ventana = t.slice(m.index, m.index + 80);
      const d = RE_DATOS_PIDE.exec(ventana);
      if (d) return ventana.slice(0, d.index + d[0].length).trim();
    }
    m = RE_VERBOS_PIDE.exec(t);
  }
  const inv = RE_DATO_LUEGO_VERBO.exec(t);
  return inv ? inv[0].trim() : null;
}

function normalizaTelefono(t) {
  return String(t).replace(/[^\d]/g, "");
}

const RE_PIDE =
  /\b(env[ií]e|env[ií]a|responda|responde|confirme|confirma|indique|indica|comparta|comparte|ingrese|ingresa|digite|digita|proporcione|proporciona|necesito|d[ií]game|dime|escriba|escribe)\b[^.]{0,80}?\b(clave|contrase[ñn]a|pin|c[oó]digo|token|cvv|tarjeta|usuario)\b/i;
const RE_PIDE_INVERSO =
  /\b(clave|contrase[ñn]a|pin|c[oó]digo de verificaci[oó]n|c[oó]digo|token|cvv|n[uú]mero de tarjeta)\b[^.]{0,60}?\b(para (continuar|activar|cancelar|verificar|desbloquear)|aqu[ií]|en el enlace)\b/i;
const RE_URGENCIA =
  /(bloquead[ao]|bloqueo|bloquee|suspendid[ao]|suspensi[oó]n|inmediat[ao]|24 horas|48 horas|hoy mismo|ahora mismo|[uú]ltimo aviso|[uú]ltima oportunidad|urgente|de inmediato|antes de|de lo contrario|ser[aá] cancelad[ao]|ser[aá] cerrad[ao]|ser[aá] limitad[ao]|quedar[aá] suspendid[ao]|evite cargos|evitar cargos|vence hoy|expire|cancelarlo)/iu;
const RE_DICE_BANCO = /\b(banco|bancodemo|banca en l[ií]nea|su cuenta|tarjeta|pr[eé]stamo|cuenta)\b/i;
const RE_TERCERO =
  /(yappy|nequi|\bach\b|transfiera|transfiere|transfiriendo|transferir|transferencia|dep[oó]site|deposite|pague|pago|env[ií]e el monto|env[ií]a el monto)[^\n]{0,80}?(\bal\b|a la cuenta|al n[uú]mero|a nombre de)/iu;

function evaluar(captura, banco) {
  const senales = [];
  const texto = String(captura.texto || "");
  const oficiales = banco.dominios_oficiales.map((d) => d.toLowerCase());
  const marca = oficiales[0].split(".")[0];
  const telOficiales = new Set(banco.telefonos_oficiales.map(normalizaTelefono));
  const diceBanco = RE_DICE_BANCO.test(texto) || RE_DICE_BANCO.test(String(captura.remitente || ""));

  for (const enlace of captura.enlaces || []) {
    const dom = dominioDe(enlace);
    if (!dom) continue;
    if (oficiales.includes(dom)) continue;
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(dom)) {
      senales.push({
        tipo: "ip_literal",
        evidencia: `El enlace apunta a una dirección IP en vez de un dominio: ${enlace}`,
      });
      continue;
    }
    if (dom.includes("xn--")) {
      senales.push({ tipo: "punycode", evidencia: `El dominio usa caracteres disfrazados: ${enlace}` });
      continue;
    }
    if (banco.acortadores.includes(dom)) {
      senales.push({ tipo: "acortador", evidencia: `Enlace acortado que esconde el destino real: ${enlace}` });
      continue;
    }
    const base = dom.split(".").slice(0, -1).join(".") || dom;
    const parecido =
      dom.includes(marca) || oficiales.some((o) => levenshtein(base.replace(/[^a-z0-9]/g, ""), o.split(".")[0]) <= 2);
    if (parecido)
      senales.push({
        tipo: "dominio_parecido",
        evidencia: `El dominio ${dom} se parece al oficial ${oficiales[0]} pero no lo es`,
      });
    else if (diceBanco)
      senales.push({
        tipo: "dominio_no_oficial",
        evidencia: `Dice ser del banco pero enlaza a ${dom}, que no es un canal oficial`,
      });
  }

  if (diceBanco) {
    for (const tel of captura.telefonos || []) {
      const n = normalizaTelefono(tel);
      if (n.length >= 4 && !telOficiales.has(n) && !telOficiales.has(n.replace(/^507/, ""))) {
        senales.push({ tipo: "numero_no_oficial", evidencia: `El número ${tel} no es un canal oficial del banco` });
      }
    }
  }

  const pideExacto = RE_PIDE.exec(texto) || RE_PIDE_INVERSO.exec(texto);
  const pide = pideExacto ? pideExacto[0] : pideDatosDifuso(texto);
  if (pide || captura.pide_datos_sensibles) {
    senales.push({
      tipo: "pide_datos_sensibles",
      evidencia: pide
        ? `Pide datos que el banco nunca pide: «${String(pide).trim()}»`
        : "El mensaje pide una clave, código o dato de tarjeta",
    });
  }

  const urg = RE_URGENCIA.exec(texto) || RE_URGENCIA_DIFUSA.exec(normaliza(texto));
  if (urg || captura.urgencia) {
    senales.push({
      tipo: "urgencia",
      evidencia: urg ? `Presiona con plazo o amenaza: «${urg[0]}»` : "El mensaje presiona con un plazo o una amenaza",
    });
  }

  const tercero = RE_TERCERO.exec(texto);
  if (tercero && (captura.telefonos || []).length + (captura.montos || []).length > 0) {
    senales.push({
      tipo: "pago_terceros",
      evidencia: `Pide un pago a un destino que no es el banco: «${tercero[0].trim()}»`,
    });
  }

  return senales;
}

// Veredicto de referencia solo con reglas. El modelo de texto lo usa como base y redacta la explicación.
const FUERTES = new Set([
  "dominio_parecido",
  "dominio_no_oficial",
  "ip_literal",
  "punycode",
  "acortador",
  "pide_datos_sensibles",
  "pago_terceros",
  "numero_no_oficial",
]);
function veredictoPorReglas(senales) {
  if (senales.some((s) => FUERTES.has(s.tipo))) return "fraude";
  if (senales.length) return "sospechoso";
  return "sin_senales";
}

module.exports = {
  evaluar,
  veredictoPorReglas,
  dominioDe,
  levenshtein,
  RE_PIDE_PUBLICA: new RegExp(RE_PIDE.source + "|" + RE_PIDE_INVERSO.source, "iu"),
  RE_URGENCIA_PUBLICA: RE_URGENCIA,
  RE_URGENCIA_DIFUSA,
  normaliza,
  pideDatosDifuso,
};
