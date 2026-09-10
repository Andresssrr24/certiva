"use strict";
const modelos = require("../lib/modelos");
const P = "Transcribe exactly all the text in this image. Output only the text.";
(async () => {
  const S = await modelos.sdk();
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
  for (const v of [
    "control-780.png",
    "control-1200.png",
    "burbuja-1a1.png",
    "fraude-bloqueo_enlace-01-acolchado.png",
  ]) {
    const t0 = Date.now();
    const { blocks } = S.ocr({ modelId: ocrId, image: `/tmp/exp-vision/${v}`, options: { paragraph: false } });
    const b = await blocks;
    console.log(
      `=== OCR · ${v} · ${Date.now() - t0} ms · ${b.length} bloques\n${b
        .map((x) => x.text)
        .join(" | ")
        .slice(0, 400)}`,
    );
  }
  await S.unloadModel({ modelId: ocrId, clearStorage: false });
  const vis = await S.loadModel(
    await modelos.argsCarga(modelos.entrada("vision", "visionpsy-flash"), { ctxSize: 4096 }),
  );
  for (const v of ["control-780.png", "burbuja-1a1.png"]) {
    const t0 = Date.now();
    const run = S.completion({
      modelId: vis,
      stream: true,
      history: [{ role: "user", content: P, attachments: [{ path: `/tmp/exp-vision/${v}` }] }],
    });
    for await (const _ of run.events) {
      /* */
    }
    const f = await run.final;
    console.log(
      `=== VisionPsy · ${v} · ${Date.now() - t0} ms\n${String(f.contentText || "")
        .trim()
        .slice(0, 300)}`,
    );
  }
  await S.unloadModel({ modelId: vis, clearStorage: false });
  process.exit(0);
})().catch((e) => {
  console.error("✖", e.message);
  process.exit(1);
});
