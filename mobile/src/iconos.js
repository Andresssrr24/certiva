// Iconos de trazo, en PNG de alfa: se pintan con tintColor, así un mismo archivo sirve en cualquier color.
// Se generan desde trazos vectoriales y viven en mobile/assets/ic-*.png.
"use strict";

const ICONOS = {
  revisar: require("./assets/ic-revisar.png"),
  historial: require("./assets/ic-historial.png"),
  aprender: require("./assets/ic-aprender.png"),
  ajustes: require("./assets/ic-ajustes.png"),
  pegar: require("./assets/ic-pegar.png"),
  captura: require("./assets/ic-captura.png"),
  telefono: require("./assets/ic-telefono.png"),
  copiar: require("./assets/ic-copiar.png"),
  flecha: require("./assets/ic-flecha.png"),
  atras: require("./assets/ic-atras.png"),
  cerrar: require("./assets/ic-cerrar.png"),
  descargar: require("./assets/ic-descargar.png"),
  basura: require("./assets/ic-basura.png"),
  candado: require("./assets/ic-candado.png"),
  info: require("./assets/ic-info.png"),
  check: require("./assets/ic-check.png"),
  alerta: require("./assets/ic-alerta.png"),
  escudo: require("./assets/ic-escudo.png"),
  ojo: require("./assets/ic-ojo.png"),
  mas: require("./assets/ic-mas.png"),
  enlace: require("./assets/ic-enlace.png"),
  imita: require("./assets/ic-imita.png"),
  servidor: require("./assets/ic-servidor.png"),
  letras: require("./assets/ic-letras.png"),
  corto: require("./assets/ic-corto.png"),
  llave: require("./assets/ic-llave.png"),
  prisa: require("./assets/ic-prisa.png"),
  billete: require("./assets/ic-billete.png"),
  ciclo: require("./assets/ic-ciclo.png"),
  desvio: require("./assets/ic-desvio.png"),
};

// Icono por tipo de señal de las reglas (lib/reglas.js).
const ICONO_SENAL = {
  dominio_parecido: "imita",
  dominio_no_oficial: "enlace",
  ip_literal: "servidor",
  punycode: "letras",
  acortador: "corto",
  numero_no_oficial: "telefono",
  pide_datos_sensibles: "llave",
  urgencia: "prisa",
  pago_terceros: "billete",
  envio_para_recibir: "ciclo",
  cambio_direccion: "desvio",
};

module.exports = { ICONOS, ICONO_SENAL };
