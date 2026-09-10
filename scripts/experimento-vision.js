// Experimento: ¿cómo lee mejor VisionPsy una captura? Transcripción libre vs esquema, imagen completa vs recorte.
// Uso: node scripts/experimento-vision.js [clave de modelo de visión]
"use strict";
const path = require("node:path");
const modelos = require("../lib/modelos");

const IDS = [
  "fraude-bloqueo_enlace-01",
  "legitimo-alerta_transaccion-01",
  "fraude-ejecutivo_whatsapp-01",
  "legitimo-correo_estado_cuenta-01",
];
const P_LIBRE =
  "Transcribe exactly all the text visible in this phone screenshot, in the original language. Output only the transcription.";
const P_LIBRE_ES =
  "Transcribe exactamente todo el texto que aparece en esta captura de pantalla de un teléfono. Responde solo con la transcripción.";
const ESQ_TEXTO = {
  type: "object",
  additionalProperties: false,
  required: ["remitente", "texto"],
  properties: { remitente: { type: "string" }, texto: { type: "string" } },
};

async function corre(S, modelId, ruta, prompt, esquema) {
  const t0 = Date.now();
  let ttft = null;
  const opts = { modelId, stream: true, history: [{ role: "user", content: prompt, attachments: [{ path: ruta }] }] };
  if (esquema) opts.responseFormat = { type: "json_schema", json_schema: { name: "t", schema: esquema } };
  const run = S.completion(opts);
  for await (const ev of run.events) {
    if (ttft === null && ev && ev.type === "contentDelta") ttft = Date.now() - t0;
  }
  const f = await run.final;
  return { texto: String(f.contentText || "").trim(), ttft, ms: Date.now() - t0 };
}

(async () => {
  const e = modelos.entrada("vision", process.argv[2]);
  const S = await modelos.sdk();
  const args = await modelos.argsCarga(e, { ctxSize: 4096 });
  console.log("Modelo:", e.label, JSON.stringify(args.modelConfig));
  const modelId = await S.loadModel({ ...args });
  for (const id of IDS) {
    const completa = path.join(__dirname, "..", "data", "capturas", `${id}.png`);
    const recorte = `/tmp/exp-vision/${id}-recorte.png`;
    console.log(`\n=================== ${id}`);
    for (const [nombre, ruta, prompt, esq] of [
      ["libre EN · completa", completa, P_LIBRE, null],
      ["libre EN · recorte", recorte, P_LIBRE, null],
      ["libre ES · recorte", recorte, P_LIBRE_ES, null],
      ["esquema texto · recorte", recorte, P_LIBRE + " Return JSON with the sender and the message text.", ESQ_TEXTO],
    ]) {
      try {
        const r = await corre(S, modelId, ruta, prompt, esq);
        console.log(`--- ${nombre} · TTFT ${r.ttft} ms · ${r.ms} ms\n${r.texto.slice(0, 400)}`);
      } catch (err) {
        console.log(`--- ${nombre} · ERROR ${err.message}`);
      }
    }
  }
  await S.unloadModel({ modelId, clearStorage: false });
  process.exit(0);
})().catch((e) => {
  console.error("✖", e && e.stack ? e.stack : e);
  process.exit(1);
});
