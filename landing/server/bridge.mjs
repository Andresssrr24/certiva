import { randomBytes, timingSafeEqual } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { analyzeText, BANK } from "../public/analyzer.js";

const require = createRequire(import.meta.url);

export function createBridge({
  token = randomBytes(32).toString("hex"),
  initiallyPaused = false,
  origins = [
    "http://127.0.0.1:4317",
    "http://localhost:4317",
    "https://certiva-landing.vercel.app",
    process.env.CERTIVA_ALLOWED_ORIGIN,
  ].filter(Boolean),
  runAnalysis = runQvac,
  sdkAvailable = () => {
    try {
      require.resolve("@qvac/sdk");
      return true;
    } catch {
      return false;
    }
  },
} = {}) {
  let busy = false;
  let paused = initiallyPaused;
  const send = (res, status, body) => {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(JSON.stringify(body));
  };
  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    // Reject DNS rebinding and browser requests from any unpaired origin.
    if (!/^127\.0\.0\.1:\d+$/.test(req.headers.host || "") && !/^localhost:\d+$/.test(req.headers.host || ""))
      return send(res, 403, { error: "Host no permitido." });
    if (origin && !origins.includes(origin)) return send(res, 403, { error: "Origen no permitido." });
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Private-Network", "true");
    }
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
      res.writeHead(204);
      return res.end();
    }
    const actual = Buffer.from(req.headers.authorization || ""),
      expected = Buffer.from("Bearer " + token);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return send(res, 401, { error: "Clave local incorrecta. Copia la clave temporal del puente." });
    if (req.url === "/health" && req.method === "GET")
      return send(res, 200, {
        ok: true,
        sdkAvailable: sdkAvailable(),
        busy,
        paused,
        modelState: paused ? "paused" : "load-on-demand",
      });
    if (req.method !== "POST" || !["/analyze-text", "/analyze-image"].includes(req.url))
      return send(res, 404, { error: "Ruta no disponible." });
    if (paused)
      return send(res, 503, {
        error:
          "QVAC está reservado temporalmente para una prueba de la app. Puedes desconectarlo para analizar texto con reglas locales.",
      });
    if (!req.headers["content-type"]?.startsWith("application/json"))
      return send(res, 415, { error: "Se requiere JSON." });
    if (busy) return send(res, 409, { error: "QVAC está analizando otro mensaje. Espera a que termine." });
    let ownsLock = false;
    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 7 * 1024 * 1024) {
          send(res, 413, { error: "La captura supera el límite de 5 MB." });
          return;
        }
        chunks.push(chunk);
      }
      let body;
      try {
        body = JSON.parse(Buffer.concat(chunks).toString());
      } catch {
        return send(res, 400, { error: "JSON inválido." });
      }
      if (req.url === "/analyze-text") {
        try {
          analyzeText(body?.text);
        } catch (e) {
          return send(res, 400, { error: e.message });
        }
      } else if (
        !body ||
        typeof body.image !== "string" ||
        !/^data:image\/(png|jpeg);base64,[a-zA-Z0-9+/]+=*$/.test(body.image)
      )
        return send(res, 400, { error: "La captura debe ser PNG o JPG." });
      if (!sdkAvailable())
        return send(res, 503, { error: "Falta @qvac/sdk. Instala las dependencias del proyecto y sus modelos." });
      // Recheck after reading the body: two concurrent streams may finish together.
      if (paused)
        return send(res, 503, {
          error: "QVAC está reservado temporalmente para una prueba de la app. Inténtalo al terminar.",
        });
      if (busy) return send(res, 409, { error: "QVAC está ocupado. Inténtalo al terminar el análisis actual." });
      busy = true;
      ownsLock = true;
      const result = await runAnalysis(req.url, body);
      send(res, 200, result);
    } catch (error) {
      send(res, error.status || 503, {
        error:
          error.publicMessage ||
          "QVAC no pudo completar la inferencia. Comprueba los modelos descargados y que no haya otra app QVAC abierta.",
      });
    } finally {
      if (ownsLock) busy = false;
    }
  });
  server.requestTimeout = 180000;
  server.headersTimeout = 15000;
  return {
    server,
    token,
    async pause() {
      if (busy) return false;
      paused = true;
      await unloadQvac();
      return true;
    },
    resume() {
      paused = false;
    },
  };
}
let motor;
export async function unloadQvac() {
  if (motor) await motor.descargarTodo();
}
async function getMotor() {
  if (!motor) {
    // Keep inference metrics out of the project's evaluation dataset.
    process.env.PERF_LOG = "/dev/null";
    const { Motor } = require("../../lib/analizar.js");
    motor = new Motor({ banco: BANK });
    // The existing RAG policy is for Banco Demo, never use it as Caja's policy.
    motor.usarPolitica = false;
  }
  return motor;
}
export async function runQvac(route, body) {
  const started = Date.now(),
    engine = await getMotor();
  let text, vision;
  if (route === "/analyze-image") {
    const [, mime, payload] = body.image.match(/^data:image\/(png|jpeg);base64,(.+)$/);
    const bytes = Buffer.from(payload, "base64");
    const valid =
      mime === "png"
        ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    if (!valid || bytes.length > 5 * 1024 * 1024) {
      const e = new Error();
      e.status = 400;
      e.publicMessage = "Imagen inválida o de más de 5 MB.";
      throw e;
    }
    const dir = await mkdtemp(join(tmpdir(), "certiva-"));
    try {
      const path = join(dir, mime === "png" ? "capture.png" : "capture.jpg");
      await writeFile(path, bytes, { mode: 0o600 });
      vision = await engine.extraerCaptura(path);
      text = vision?.captura?.texto || "";
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  } else text = body.text;
  let local;
  try {
    local = analyzeText(text);
  } catch {
    return { verdict: "no_legible", signals: [], domains: [], engine: "qvac", elapsedMs: Date.now() - started };
  }
  // A single generative transcription cannot establish absence of risk.
  if (vision && local.verdict === "sin_senales") local.verdict = "no_legible";
  const signals = local.signals.map((s) => ({ tipo: s.type, evidencia: s.evidence }));
  const response = await engine.veredicto(
    {
      canal: "otro",
      remitente: "",
      texto: text,
      enlaces: local.domains,
      telefonos: [],
      montos: [],
      pide_datos_sensibles: local.signals.some((s) => s.type === "sensitive"),
    },
    signals,
    local.verdict,
  );
  const raw = response.veredicto;
  if (!raw || !["fraude", "sospechoso", "sin_senales", "no_legible"].includes(raw.veredicto))
    throw new Error("Invalid QVAC result");
  const rank = { sin_senales: 0, sospechoso: 1, fraude: 2 };
  const verdict =
    local.verdict === "no_legible"
      ? "no_legible"
      : raw.veredicto === "no_legible" && local.verdict === "sin_senales"
        ? "no_legible"
        : rank[raw.veredicto] > rank[local.verdict]
          ? raw.veredicto
          : local.verdict;
  // The visible action and official links remain deterministic; model text cannot redirect a user.
  return {
    ...local,
    verdict,
    engine: "qvac",
    elapsedMs: Date.now() - started,
    model: response.modelo,
    vision: vision?.modelo,
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const retained = process.env.CERTIVA_PAIR_TOKEN;
  if (retained && !/^[a-f0-9]{64}$/.test(retained)) throw new Error("Clave de sesión inválida.");
  const { server, token, pause, resume } = createBridge({
    ...(retained ? { token: retained } : {}),
    initiallyPaused: process.env.CERTIVA_QVAC_PAUSED === "1",
  });
  delete process.env.CERTIVA_PAIR_TOKEN;
  server.listen(4318, "127.0.0.1", () =>
    console.log(
      `Puente Certiva: http://127.0.0.1:4318\nClave temporal (solo para este equipo): ${token}\nConexión directa: https://certiva-landing.vercel.app/#qvac=${token}\nPega esta clave en «Conectar motor QVAC local» de la landing.\nNo ejecutes otra aplicación QVAC mientras este puente esté analizando.`,
    ),
  );
  const close = () => {
    server.close();
    Promise.resolve(motor?.descargarTodo()).finally(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on("SIGINT", close);
  process.on("SIGTERM", close);
  process.on(
    "SIGUSR2",
    () =>
      void pause()
        .then((ok) => console.log(ok ? "QVAC pausado; worker cedido." : "No se pausó: hay un análisis activo."))
        .catch(() => console.error("No se pudo liberar el motor.")),
  );
  process.on("SIGHUP", () => {
    resume();
    console.log("QVAC reanudado con la misma clave.");
  });
}
