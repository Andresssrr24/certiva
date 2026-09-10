"use strict";
const modelos = require("../lib/modelos");
const IDS = ["fraude-bloqueo_enlace-01", "legitimo-alerta_transaccion-01", "fraude-ejecutivo_whatsapp-01", "legitimo-correo_estado_cuenta-01"];
const P = "Transcribe exactly all the text visible in this phone screenshot, in the original language. Output only the transcription.";
(async () => {
  const e = modelos.entrada("vision", "visionpsy-flash"); const S = await modelos.sdk();
  const modelId = await S.loadModel(await modelos.argsCarga(e, { ctxSize: 4096 }));
  for (const id of IDS) for (const v of ["cuadrado", "acolchado"]) {
    const t0 = Date.now();
    const run = S.completion({ modelId, stream: true, history: [{ role: "user", content: P, attachments: [{ path: `/tmp/exp-vision/${id}-${v}.png` }] }] });
    for await (const _ of run.events) { /* */ }
    const f = await run.final;
    console.log(`=== ${id} · ${v} · ${Date.now() - t0} ms\n${String(f.contentText || "").trim().slice(0, 500)}`);
  }
  await S.unloadModel({ modelId, clearStorage: false }); process.exit(0);
})().catch((e) => { console.error("✖", e.message); process.exit(1); });
