"use strict";
const modelos = require("../lib/modelos");
const IDS = ["fraude-bloqueo_enlace-01", "fraude-ejecutivo_whatsapp-01"];
const P =
  "Transcribe exactly all the text visible in this phone screenshot, in the original language. Output only the transcription.";
(async () => {
  const S = await modelos.sdk();
  const e = modelos.entrada("vision", "visionpsy-flash");
  const vis = await S.loadModel(await modelos.argsCarga(e, { ctxSize: 4096 }));
  for (const id of IDS)
    for (const v of ["rgb.png", "jpg.jpg", "gris.png"]) {
      const t0 = Date.now();
      const run = S.completion({
        modelId: vis,
        stream: true,
        history: [{ role: "user", content: P, attachments: [{ path: `/tmp/exp-vision/${id}-${v}` }] }],
      });
      for await (const _ of run.events) {
        /* */
      }
      const f = await run.final;
      console.log(
        `=== VisionPsy · ${id} · ${v} · ${Date.now() - t0} ms\n${String(f.contentText || "")
          .trim()
          .slice(0, 300)}`,
      );
    }
  await S.unloadModel({ modelId: vis, clearStorage: false });
  const ocrId = await S.loadModel({
    modelSrc: S.OCR_LATIN,
    modelType: "ggml-ocr",
    modelConfig: {
      langList: ["es"],
      magRatio: 1.0,
      defaultRotationAngles: [],
      contrastRetry: false,
      lowConfidenceThreshold: 0.3,
      recognizerBatchSize: 4,
    },
  });
  for (const v of ["rgb.png", "jpg.jpg"]) {
    const t0 = Date.now();
    const { blocks } = S.ocr({
      modelId: ocrId,
      image: `/tmp/exp-vision/fraude-bloqueo_enlace-01-${v}`,
      options: { paragraph: false },
    });
    const b = await blocks;
    console.log(
      `=== OCR · ${v} · ${Date.now() - t0} ms · ${b.length} bloques\n${b
        .map((x) => x.text)
        .join(" | ")
        .slice(0, 400)}`,
    );
    if (v === "rgb.png") console.log("bbox ejemplo:", JSON.stringify(b[0] && (b[0].bbox || b[0].box)).slice(0, 120));
  }
  await S.unloadModel({ modelId: ocrId, clearStorage: false });
  process.exit(0);
})().catch((e) => {
  console.error("✖", e.message);
  process.exit(1);
});
