// Los textos que la app enseña: qué significa cada señal, qué hacer después de un veredicto y cuáles son los
// canales oficiales del emisor. Salen de la política anti-fraude del banco (core/politica-antifraude.md), no de
// un modelo: en el teléfono no hay redactor.
"use strict";
const { banco, SENAL } = require("./consejos");

const SENALES = [
  {
    tipo: "pide_datos_sensibles",
    explicacion: "Te piden la clave, el PIN, el código que llegó por SMS o la frase semilla. El banco nunca los pide.",
    ejemplo: "«Confirme su clave para reactivar la cuenta»",
  },
  {
    tipo: "dominio_parecido",
    explicacion: "Una dirección casi igual a la oficial: una letra cambiada, un guion de más o un final distinto.",
    ejemplo: "bancodemo-seguro.com en vez de bancodemo.com.pa",
  },
  {
    tipo: "urgencia",
    explicacion: "Un plazo o una amenaza para que actúes sin pensar. La prisa es la herramienta del estafador.",
    ejemplo: "«Su cuenta será bloqueada en 24 horas»",
  },
  {
    tipo: "dominio_no_oficial",
    explicacion: "El enlace lleva a un sitio que no es del banco, aunque el mensaje diga que sí.",
    ejemplo: "verificar.tu-cuenta.net",
  },
  {
    tipo: "acortador",
    explicacion: "Un enlace corto que esconde a dónde lleva de verdad. El banco no los usa.",
    ejemplo: "bit.ly/3xKq2 en un aviso de seguridad",
  },
  {
    tipo: "ip_literal",
    explicacion: "El enlace es una serie de números en vez de un nombre. Ningún banco te manda a una dirección así.",
    ejemplo: "http://190.34.12.9/acceso",
  },
  {
    tipo: "punycode",
    explicacion: "Letras de otro alfabeto que se ven iguales a las nuestras y llevan a otro sitio.",
    ejemplo: "bаncodemo.com.pa con una «a» que no es la nuestra",
  },
  {
    tipo: "numero_no_oficial",
    explicacion: "Un celular personal que se presenta como el banco.",
    ejemplo: "«Escríbanos al 6xxx-xxxx» en vez del 800-1234",
  },
  {
    tipo: "pago_terceros",
    explicacion: "Te piden mover dinero por Yappy, ACH o a la cuenta de una persona.",
    ejemplo: "«Haga el pago por Yappy al 6xxx-xxxx»",
  },
  {
    tipo: "envio_para_recibir",
    explicacion: "Te piden enviar dinero primero para recibir un premio, un reembolso o una devolución.",
    ejemplo: "«Deposite $40 para liberar su premio»",
  },
  {
    tipo: "cambio_direccion",
    explicacion: "Avisan a última hora de un cambio de cuenta o de dirección de pago.",
    ejemplo: "«Cambiamos de banco, deposite en esta cuenta»",
  },
].map((s) => ({ ...s, titulo: SENAL[s.tipo] || s.tipo }));

// Qué hacer después de cada veredicto. Pasos cortos, en orden, accionables por una persona mayor.
const PASOS = {
  fraude: [
    "No toques el enlace ni respondas el mensaje.",
    "No compartas tu clave ni el código que te llega por SMS, aunque te llamen del «banco».",
    `Si ya compartiste algo o tocaste el enlace, llama al ${banco.telefonos_oficiales[0]} y bloquea la tarjeta desde la app.`,
    "Borra el mensaje y avisa a alguien de confianza: estos mensajes llegan en tandas.",
  ],
  sospechoso: [
    "No hagas nada con prisa. Cierra el mensaje.",
    `Compara el enlace letra por letra con el oficial: ${banco.dominios_oficiales[0]}.`,
    `Llama tú al ${banco.telefonos_oficiales[0]}, el número de tu tarjeta, y confirma antes de responder.`,
  ],
  sin_senales: [
    "No encontré señales, pero eso no vuelve seguro el mensaje.",
    "Si te piden clave o código, es estafa aunque el mensaje parezca normal.",
    `Entra al banco escribiendo tú la dirección ${banco.dominios_oficiales[1] || banco.dominios_oficiales[0]}, nunca por un enlace.`,
  ],
  no_legible: [
    "Prueba con una captura más nítida, con el mensaje completo y el enlace visible.",
    "O copia el texto del mensaje y pégalo en la pantalla de inicio.",
    "Ante la duda, no respondas y llama al banco.",
  ],
};

const SI_YA_CAISTE = [
  `Llama ya al ${banco.telefonos_oficiales[0]} y di lo que compartiste.`,
  "Bloquea la tarjeta desde la app oficial del banco.",
  "Cambia la clave desde la app, nunca desde un enlace del mensaje.",
  "Guarda el mensaje y repórtalo: ayuda a que no le pase a otro.",
];

const CANALES = [
  { icono: "telefono", titulo: "Teléfonos", valor: banco.telefonos_oficiales.join(" · ") },
  { icono: "enlace", titulo: "Direcciones web", valor: banco.dominios_oficiales.join(" · ") },
  { icono: "escudo", titulo: "Quien te escribe", valor: banco.remitentes_oficiales.slice(0, 3).join(" · ") },
];

const REGLA_DE_ORO =
  "El banco nunca te pide tu clave ni el código que te llega por SMS. Nunca. Ni por mensaje, ni por correo, ni por teléfono.";

const BANCO = banco;

const VERSION = "0.3.0";

module.exports = { SENALES, PASOS, SI_YA_CAISTE, CANALES, REGLA_DE_ORO, BANCO, VERSION };
