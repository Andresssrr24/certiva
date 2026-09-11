/* Directorio editorial consultado con IA en fuentes primarias. No es una búsqueda en vivo. */
(function (root) {
  "use strict";
  const directorio = {
    banco: "Caja de Ahorros",
    consultadoEl: "2026-09-10",
    consulta: "Consultado por IA",
    fuentes: [
      {
        id: "seguridad",
        titulo: "Recomendaciones de seguridad bancaria",
        url: "https://www.cajadeahorros.com.pa/recomendaciones-seguridad-bancaria/",
      },
      {
        id: "banca",
        titulo: "Banca en línea · Canales de atención",
        url: "https://www.cajadeahorros.com.pa/canales-digitales/banca-en-linea/",
      },
      { id: "andrea", titulo: "A.N.D.R.E.A. · WhatsApp oficial", url: "https://www.cajadeahorros.com.pa/andrea/" },
    ],
    contactos: [
      {
        id: "atencion",
        numero: "800-2252",
        titulo: "Reportar actividad sospechosa",
        canal: "Atención telefónica",
        uso: "Llama al banco para informar una situación sospechosa y pedir orientación.",
        fuentes: ["seguridad", "banca"],
      },
      {
        id: "exterior",
        numero: "+507 508-3456",
        titulo: "Desde celular o el extranjero",
        canal: "Atención telefónica",
        uso: "Canal publicado para consultas y reportes sobre Banca en Línea.",
        fuentes: ["banca"],
      },
      {
        id: "andrea",
        numero: "+507 6949-0076",
        titulo: "WhatsApp A.N.D.R.E.A.",
        canal: "Asistente virtual",
        uso: "Consultas y orientación; el banco también publica bloqueo de tarjetas por robo o pérdida.",
        fuentes: ["andrea", "banca"],
      },
    ],
  };
  function normalizar(numero) {
    const entrada = String(numero || "").trim();
    if (!/^(?:\+|00)?[\d\s().-]+$/.test(entrada)) return null;
    let digitos = entrada.replace(/\D/g, "");
    const internacional = entrada.startsWith("+") || entrada.startsWith("00");
    if (entrada.startsWith("00")) digitos = digitos.slice(2);
    if (internacional && !digitos.startsWith("507")) return null;
    if (internacional || ((digitos.length === 10 || digitos.length === 11) && digitos.startsWith("507")))
      digitos = digitos.slice(3);
    return /^\d{7,8}$/.test(digitos) ? digitos : null;
  }
  function comparar(numero) {
    const limpio = normalizar(numero);
    if (!limpio) return { estado: "invalido", contacto: null };
    const contacto = directorio.contactos.find((c) => normalizar(c.numero) === limpio) || null;
    return { estado: contacto ? "coincide" : "no_encontrado", contacto };
  }
  function fuentePorId(id) {
    return directorio.fuentes.find((f) => f.id === id) || null;
  }
  function consejoSinTelefonosGenerados(accion) {
    const texto = String(accion || "");
    // Los teléfonos de contacto provienen del directorio, nunca de la generación del modelo.
    return /\d[\d\s().-]{5,}\d/.test(texto)
      ? "No respondas ni compartas claves o códigos. Para confirmar lo ocurrido, consulta los canales publicados por tu banco e inicia tú el contacto."
      : texto;
  }
  const api = { directorio, normalizar, comparar, fuentePorId, consejoSinTelefonosGenerados };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CertivaContactos = api;
})(globalThis);
