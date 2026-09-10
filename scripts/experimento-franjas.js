// ¿Lee mejor VisionPsy en franjas de 2-3 líneas? Une la transcripción de 3 franjas por captura.
"use strict";
const modelos = require("../lib/modelos");
const IDS = ["fraude-bloqueo_enlace-01", "legitimo-alerta_transaccion-01", "fraude-ejecutivo_whatsapp-01", "legitimo-correo_estado_cuenta-01"];
const P = "Transcribe exactly all the text in this image. Output only the text.";
async function corre(S, modelId, ruta) {
  const t0 = Date.now(); let ttft = null;
  const run = S.completion({ modelId, stream: true, history: [{ role: "user", content: P, attachments: [{ path: ruta }] }] });
  for await (const ev of run.events) { if (ttft === null && ev && ev.type === "contentDelta") ttft = Date.now() - t0; }
  const f = await run.final; return { texto: String(f.contentText || "").trim(), ttft, ms: Date.now() - t0 };
}
(async () => {
  for (const key of ["visionpsy-flash", "visionpsy-base"]) {
    const e = modelos.entrada("vision", key); const S = await modelos.sdk();
    const modelId = await S.loadModel(await modelos.argsCarga(e, { ctxSize: 4096 }));
    console.log(`\n########## ${e.label}`);
    for (const id of IDS) {
      const partes = []; let ms = 0;
      for (let k = 0; k < 3; k++) { const r = await corre(S, modelId, `/tmp/exp-vision/${id}-franja${k}.png`); partes.push(r.texto); ms += r.ms; }
      const mitad = await corre(S, modelId, `/tmp/exp-vision/${id}-mitad.png`);
      console.log(`=== ${id} · franjas ${ms} ms\n${partes.join(" | ").slice(0, 420)}\n--- mitad de resolución · ${mitad.ms} ms\n${mitad.texto.slice(0, 200)}`);
    }
    await S.unloadModel({ modelId, clearStorage: false });
  }
  process.exit(0);
})().catch((e) => { console.error("✖", e && e.stack ? e.stack : e); process.exit(1); });
