"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { Motor } = require("../lib/analizar");
const { entradaTexto } = require("../lib/entrada-texto");
const msg = {
  canal: "whatsapp",
  remitente: "+507 6000-1234",
  texto: "Envíe su código de verificación. Su cuenta será bloqueada hoy. https://seguridad.example.com/acceso",
};
function motor() {
  const m = new Motor();
  m.extraerCaptura =
    m.extraerConOcr =
    m.contrastar =
      async () => {
        throw new Error("Unexpected image processing");
      };
  return m;
}
test("texto recibido conserva cuerpo, canal y URL sin correcciones visuales", () => {
  const message = { ...msg, texto: "https://bancodemo.comlogin\nNo compartas tu PIN." };
  const r = entradaTexto(message);
  assert.equal(r.captura.texto, message.texto);
  assert.equal(r.captura.canal, message.canal);
  assert.deepEqual(r.captura.enlaces, ["https://bancodemo.comlogin"]);
  assert.equal(r.ttft, null);
  assert.throws(() => entradaTexto({ ...msg, texto: "x".repeat(12001) }));
  assert.throws(() => entradaTexto({ ...msg, canal: "invalid" }));
});
test("alerta precede al modelo lento y el veredicto final conserva protección", async () => {
  const m = motor();
  let finish,
    started = false,
    initial;
  m.veredicto = async () => {
    started = true;
    return new Promise((resolve) => (finish = resolve));
  };
  const pending = m.analizarTexto(msg, {
    onAlerta: (value) => {
      assert.equal(started, false);
      initial = value;
    },
  });
  assert.equal(initial.preliminar, true);
  assert.equal(initial.veredicto.veredicto, "fraude");
  assert.equal(initial.origen, "texto");
  assert.ok(started);
  finish({ veredicto: { veredicto: "sin_senales", confianza: 0.9 }, ms: 10 });
  const result = await pending;
  assert.equal(result.veredicto.veredicto, "fraude");
  assert.equal(result.preliminar, undefined);
  assert.equal(result.modelos.vision, "Texto recibido · sin OCR");
  assert.equal(result.revision, null);
});
test("no se anticipa ausencia de señales ni se llama OCR sobre texto", async () => {
  const m = motor();
  let warnings = 0;
  m.veredicto = async () => ({ veredicto: { veredicto: "sin_senales", confianza: 0.5 }, ms: 1 });
  const r = await m.analizarTexto(
    { canal: "sms", texto: "Buenos días. Tu estado de cuenta está disponible en la aplicación." },
    { onAlerta: () => warnings++ },
  );
  assert.equal(warnings, 0);
  assert.equal(r.veredicto.veredicto, "sin_senales");
  assert.match(r.veredicto.accion, /no confirma/);
});
test("fallo de IA conserva advertencia previa y texto vacío sigue no concluyente", async () => {
  const m = motor();
  m.veredicto = async () => {
    throw new Error("model unavailable");
  };
  assert.equal((await m.analizarTexto(msg)).veredicto.veredicto, "fraude");
  assert.equal((await m.analizarTexto({ canal: "sms", texto: "" })).veredicto.veredicto, "no_legible");
});
