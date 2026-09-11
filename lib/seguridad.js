"use strict";
// La generación explica las evidencias, pero no puede rebajar el mínimo de protección.
function asegurarVeredicto(v, base, senales, banco) {
  const rango = { sin_senales: 0, sospechoso: 1, fraude: 2 };
  const valido = v && ["sin_senales", "sospechoso", "fraude", "no_legible"].includes(v.veredicto);
  let tipo = valido ? v.veredicto : base === "sin_senales" ? "no_legible" : base;
  if (base === "no_legible") tipo = "no_legible";
  else if (base !== "sin_senales" && rango[base] > (rango[tipo] ?? -1)) tipo = base;
  const forzado = !valido || tipo !== v.veredicto;
  const acciones = {
    fraude:
      "No compartas claves ni códigos y no abras el enlace. Consulta al banco por el número impreso en tu tarjeta.",
    sospechoso:
      "Detente y verifica el mensaje con el banco por el número de tu tarjeta. No compartas claves ni códigos.",
    no_legible:
      "La lectura no es concluyente. Revisa el texto de la captura o prueba otra imagen; no compartas claves ni códigos.",
    sin_senales:
      "No encontré señales en el texto leído; eso no confirma que sea auténtico. Nunca compartas claves ni códigos.",
  };
  return {
    ...(v || {}),
    veredicto: tipo,
    confianza: forzado ? 0 : Math.max(0, Math.min(1, Number(v.confianza) || 0)),
    accion: forzado || tipo === "sin_senales" || tipo === "no_legible" ? acciones[tipo] : v.accion,
    canal_oficial: `Consulta el número impreso en tu tarjeta de ${banco.nombre}.`,
    senales: forzado ? senales : v.senales || senales,
  };
}
module.exports = { asegurarVeredicto };
