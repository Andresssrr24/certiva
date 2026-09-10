// ¿Responde bien VisionPsy preguntas dirigidas sobre la captura? Una pregunta por llamada, respuestas cortas.
"use strict";
const modelos = require("../lib/modelos");
const IDS = [
  "fraude-bloqueo_enlace-01",
  "legitimo-alerta_transaccion-01",
  "fraude-ejecutivo_whatsapp-01",
  "legitimo-correo_estado_cuenta-01",
  "fraude-pide_codigo-01",
  "legitimo-otp_legitimo-01",
];
const PREGUNTAS = [
  ["enlace", "What is the full web link (URL) written in the message? Answer with the link only, or NONE."],
  ["remitente", "Who sent this message? Answer with the sender name, phone number or email exactly as shown."],
  ["canal", "Is this screenshot from SMS, WhatsApp or email? Answer with one word."],
  [
    "pide",
    "Does the message ask the reader to send, reply with or confirm a password, PIN or verification code? Answer YES or NO.",
  ],
  ["urgencia", "Does the message pressure the reader with a deadline, a block or a threat? Answer YES or NO."],
  ["banco", "Does the message claim to come from a bank? Answer YES or NO."],
];
async function corre(S, modelId, ruta, prompt) {
  const t0 = Date.now();
  const run = S.completion({
    modelId,
    stream: true,
    history: [{ role: "user", content: prompt, attachments: [{ path: ruta }] }],
  });
  for await (const _ of run.events) {
    /* */
  }
  const f = await run.final;
  return {
    texto: String(f.contentText || "")
      .trim()
      .replace(/\s+/g, " "),
    ms: Date.now() - t0,
  };
}
(async () => {
  const e = modelos.entrada("vision", process.argv[2] || "visionpsy-flash");
  const S = await modelos.sdk();
  const modelId = await S.loadModel(await modelos.argsCarga(e, { ctxSize: 4096 }));
  const verdad = require("../data/verdad.json");
  console.log(`########## ${e.label}`);
  for (const id of IDS) {
    const v = verdad[id];
    const ruta = `${__dirname}/../data/capturas/${id}.png`;
    console.log(
      `\n=== ${id} · verdad: canal ${v.canal} · remitente ${v.remitente} · enlaces ${JSON.stringify(v.enlaces)} · pide ${v.pide_datos_sensibles} · urgencia ${v.urgencia}`,
    );
    let ms = 0;
    for (const [k, p] of PREGUNTAS) {
      const r = await corre(S, modelId, ruta, p);
      ms += r.ms;
      console.log(`  ${k.padEnd(9)} ${r.texto.slice(0, 90)}`);
    }
    console.log(`  (${ms} ms en ${PREGUNTAS.length} preguntas)`);
  }
  await S.unloadModel({ modelId, clearStorage: false });
  process.exit(0);
})().catch((e) => {
  console.error("✖", e && e.stack ? e.stack : e);
  process.exit(1);
});
