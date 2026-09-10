"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { asegurarVeredicto } = require("../lib/seguridad");
const { Motor } = require("../lib/analizar");
const banco = require("../data/banco-demo.json");
const captura = {
  canal: "sms",
  remitente: "",
  texto: "Tu estado mensual está disponible para consultar",
  enlaces: [],
  telefonos: [],
  montos: [],
};
function motor(texto = captura.texto) {
  const m = new Motor();
  m.extraerCaptura = async () => ({ captura: { ...captura, texto }, ms: 1, ttft: 1 });
  m.extraerConOcr = async () => ({ captura: { ...captura }, ms: 1 });
  m.veredicto = async () => ({ veredicto: { veredicto: "sin_senales", confianza: 0.99, accion: "Todo bien" }, ms: 1 });
  return m;
}
test("el modelo no rebaja una alerta de fraude", () => {
  const v = asegurarVeredicto({ veredicto: "sin_senales" }, "fraude", [], banco);
  assert.equal(v.veredicto, "fraude");
  assert.match(v.accion, /No compartas/);
});
test("respuesta inválida sin evidencias se abstiene", () => {
  assert.equal(asegurarVeredicto(null, "sin_senales", [], banco).veredicto, "no_legible");
});
test("segunda lectura coincide, sin afirmar autenticidad", async () => {
  const r = await motor().analizar("sintetica.png");
  assert.equal(r.veredicto.veredicto, "sin_senales");
  assert.match(r.veredicto.accion, /no confirma/);
  assert.equal(r.revision.estado, "contrastada");
});
test("OCR recupera petición de código omitida por visión", async () => {
  const m = motor();
  m.extraerConOcr = async () => ({
    captura: { ...captura, texto: "Envíame el código de verificación", pide_datos_sensibles: true },
  });
  const r = await m.analizar("sintetica.png");
  assert.equal(r.veredicto.veredicto, "fraude");
  assert.equal(r.revision.estado, "alerta_segunda_lectura");
});
test("lectores discrepantes se abstienen", async () => {
  const r = await motor("Texto parcialmente borrado ilegible").analizar("sintetica.png");
  assert.equal(r.veredicto.veredicto, "no_legible");
});
test("fallo del segundo lector no produce tranquilidad", async () => {
  const m = motor();
  m.extraerConOcr = async () => {
    throw new Error("OCR no disponible");
  };
  assert.equal((await m.analizar("sintetica.png")).veredicto.veredicto, "no_legible");
});
test("fallo del generador entrega una acción de revisión", async () => {
  const m = motor();
  m.veredicto = async () => {
    throw new Error("falló generación");
  };
  assert.equal((await m.analizar("sintetica.png")).veredicto.veredicto, "no_legible");
});
