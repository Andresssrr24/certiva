// Consejo fijo por tipo de señal, en el idioma de una persona mayor. En el teléfono no hay modelo que redacte:
// el texto sale de aquí y del registro de canales del emisor.
"use strict";
const banco = require("./core/banco-demo.json");

const SENAL = {
  dominio_parecido: "La dirección web imita la del banco",
  dominio_no_oficial: "La dirección web no es del banco",
  ip_literal: "El enlace lleva a una dirección extraña",
  punycode: "El enlace usa letras disfrazadas",
  acortador: "El enlace esconde a dónde lleva",
  numero_no_oficial: "El número no es del banco",
  pide_datos_sensibles: "Te piden tu clave, tu código o tu frase semilla",
  urgencia: "Te meten prisa",
  pago_terceros: "Te piden mover dinero",
  envio_para_recibir: "Te piden enviar dinero para recibir más",
  cambio_direccion: "Te piden cambiar la dirección de pago",
};

const CONSEJO = {
  fraude:
    "No toques el enlace, no respondas y no compartas ningún dato. Si ya lo hiciste, llama ahora mismo al banco y bloquea la tarjeta desde la app.",
  sospechoso: "No hagas nada con prisa. Cierra el mensaje y llama tú al número oficial de tu tarjeta para confirmar.",
  sin_senales:
    "No encontré señales de estafa. Eso no lo vuelve seguro: el banco nunca te pide tu clave ni el código que te llega por SMS.",
  no_legible: "No pude leer bien la captura. Prueba con una imagen más nítida, o pega el texto del mensaje.",
};

const ETIQUETA = {
  fraude: "Es una estafa",
  sospechoso: "Sospechoso",
  sin_senales: "Sin señales de estafa",
  no_legible: "No pude leerlo",
};

function consejoPara(veredicto) {
  return {
    etiqueta: ETIQUETA[veredicto] || veredicto,
    consejo: CONSEJO[veredicto] || CONSEJO.sospechoso,
    canalOficial: banco.canal_oficial,
    telefono: banco.telefonos_oficiales[0],
  };
}

module.exports = { SENAL, consejoPara, banco };
