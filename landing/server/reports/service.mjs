import { createHash, createHmac, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { seal, unseal } from "../beta.mjs";
import { blobStore, update } from "./store.mjs";
import { fail, validateReport } from "./validation.mjs";

const derive = promisify(scrypt);
const ORIGIN = "https://certiva-landing.vercel.app";
const COOKIE = "__Host-certiva-reports";
const HOUR = 3600000;
export const accountKey = (username) => `reports/v1/accounts/${hash(username)}.json`;
const hash = (value) => createHash("sha256").update(value).digest("hex");
const validName = (value) => typeof value === "string" && /^[a-z0-9_-]{3,40}$/.test(value);
const equal = (a, b) =>
  typeof a === "string" &&
  typeof b === "string" &&
  a.length === b.length &&
  timingSafeEqual(Buffer.from(a), Buffer.from(b));
function cookie(value, age) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
}
export async function newAccount(username, password) {
  if (!validName(username) || typeof password !== "string" || password.length < 20)
    throw new Error("Invalid provisioning");
  const salt = randomBytes(16).toString("hex");
  return {
    schema: 1,
    username,
    active: true,
    salt,
    password: (await derive(password, salt, 32)).toString("hex"),
    sessions: [],
    cases: [],
    reportTimes: [],
  };
}
function stateFor(account, identity, csrf, write, now) {
  if (!account?.active || account.username !== identity.user) fail(401, "La sesión venció. Vuelve a ingresar");
  const session = account.sessions.find((item) => item.expires > now && equal(item.id, hash(identity.token)));
  if (!session) fail(401, "La sesión venció. Vuelve a ingresar");
  if (write && !equal(session.csrf, hash(typeof csrf === "string" ? csrf : "")))
    fail(403, "Verificación de sesión inválida");
  return session;
}
async function body(req) {
  if ((req.headers["content-type"] || "").split(";")[0] !== "application/json") fail(415, "Se requiere JSON");
  if (Number(req.headers["content-length"]) > 16384) fail(413, "Solicitud demasiado grande");
  let raw = req.body;
  if (raw === undefined) {
    const parts = [];
    let size = 0;
    for await (const part of req) {
      size += part.length;
      if (size > 16384) fail(413, "Solicitud demasiado grande");
      parts.push(part);
    }
    raw = Buffer.concat(parts).toString("utf8");
  }
  if (Buffer.isBuffer(raw)) raw = raw.toString("utf8");
  if (typeof raw !== "string" && Buffer.byteLength(JSON.stringify(raw) || "") > 16384)
    fail(413, "Solicitud demasiado grande");
  if (typeof raw === "string") {
    if (Buffer.byteLength(raw) > 16384) fail(413, "Solicitud demasiado grande");
    try {
      raw = JSON.parse(raw);
    } catch {
      fail(400, "JSON inválido");
    }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) fail(400, "JSON inválido");
  return raw;
}
async function rateLimit(req, store, secret, now) {
  // Vercel overwrites x-vercel-forwarded-for. No raw IP or user-agent is stored.
  const peer = createHmac("sha256", secret)
    .update(String(req.headers["x-vercel-forwarded-for"] || "unknown"))
    .digest("hex");
  const allowed = await update(store, "reports/v1/login-limits.json", { peers: {}, window: now, total: 0 }, (state) => {
    if (state.window + 60000 <= now) {
      state.window = now;
      state.total = 0;
    }
    for (const [key, value] of Object.entries(state.peers)) if (value.until <= now) delete state.peers[key];
    const entry = state.peers[peer] || { total: 0, until: now + 300000 };
    if (state.total >= 120 || entry.total >= 20 || Object.keys(state.peers).length >= 1000) return false;
    state.total++;
    entry.total++;
    state.peers[peer] = entry;
    return true;
  });
  if (!allowed) fail(429, "Demasiados intentos. Espera unos minutos");
}
export function createReportsHandler({
  env = process.env,
  store = blobStore(env.BLOB_READ_WRITE_TOKEN),
  now = Date.now,
} = {}) {
  return async function reports(req, res) {
    const send = (status, result) => {
      res.statusCode = status;
      res.end(JSON.stringify(result));
    };
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Content-Type-Options", "nosniff");
    try {
      if (env.REPORTS_ENABLED !== "true" || !env.REPORTS_COOKIE_SECRET || env.REPORTS_COOKIE_SECRET.length < 32)
        fail(503, "El servicio de reportes todavía no está disponible");
      if (req.headers.origin && req.headers.origin !== ORIGIN) fail(403, "Origen no permitido");
      if (req.headers["sec-fetch-site"] === "cross-site") fail(403, "Origen no permitido");
      const route = new URL(req.url, ORIGIN).pathname;
      const time = now();
      if (route === "/api/reports/health" && req.method === "GET") return send(200, { ready: true, version: 1 });
      if (route === "/api/reports/login" && req.method === "POST") {
        const data = await body(req);
        await rateLimit(req, store, env.REPORTS_COOKIE_SECRET, time);
        if (
          !validName(data.username) ||
          typeof data.password !== "string" ||
          data.password.length > 200 ||
          Object.keys(data).some((key) => !["username", "password"].includes(key))
        )
          fail(401, "Usuario o contraseña incorrectos");
        const key = accountKey(data.username);
        const current = await store.read(key);
        const account = current?.value;
        const check = (await derive(data.password, account?.salt || "unassigned-pilot-account", 32)).toString("hex");
        if (!account?.active || !equal(check, account.password)) fail(401, "Usuario o contraseña incorrectos");
        const token = randomBytes(32).toString("hex");
        const csrf = randomBytes(24).toString("hex");
        await update(store, key, null, (state) => {
          if (!state?.active || !equal(state.password, check)) fail(401, "Usuario o contraseña incorrectos");
          state.sessions = state.sessions.filter((item) => item.expires > time).slice(-4);
          state.sessions.push({ id: hash(token), csrf: hash(csrf), expires: time + HOUR });
        });
        res.setHeader(
          "Set-Cookie",
          cookie(seal({ user: account.username, token, exp: time + HOUR }, env.REPORTS_COOKIE_SECRET), 3600),
        );
        return send(200, { id: account.username, role: "cliente", csrf });
      }
      const methods = {
        "/api/reports/session": ["GET"],
        "/api/reports/cases": ["GET", "POST"],
        "/api/reports/logout": ["POST"],
        "/api/reports/erase": ["POST"],
      };
      if (!methods[route]) fail(404, "Ruta no encontrada");
      if (!methods[route].includes(req.method)) fail(405, "Método no permitido");
      const rawCookie = (req.headers.cookie || "")
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${COOKIE}=`))
        ?.slice(COOKIE.length + 1);
      const identity = unseal(rawCookie, env.REPORTS_COOKIE_SECRET, time);
      if (
        !identity ||
        !validName(identity.user) ||
        typeof identity.token !== "string" ||
        !/^[a-f0-9]{64}$/.test(identity.token)
      )
        fail(401, "Inicia sesión para continuar");
      const key = accountKey(identity.user);
      const current = await store.read(key);
      stateFor(current?.value, identity, req.headers["x-csrf-token"], req.method !== "GET", time);
      if (route === "/api/reports/session") return send(200, { id: identity.user, role: "cliente" });
      if (route === "/api/reports/cases" && req.method === "GET")
        return send(200, { cases: current.value.cases, limit: 200 });
      const data = route.endsWith("/logout") ? {} : await body(req);
      if (route === "/api/reports/logout" || route === "/api/reports/erase") {
        if (route.endsWith("/erase") && data.confirm !== true) fail(400, "Confirma el borrado de tus reportes");
        await update(store, key, null, (state) => {
          stateFor(state, identity, req.headers["x-csrf-token"], true, time);
          if (route.endsWith("/erase")) {
            state.reportTimes = (state.reportTimes || state.cases.map((item) => item.created)).filter(
              (created) => created > time - HOUR,
            );
            state.cases = [];
          } else state.sessions = state.sessions.filter((item) => item.id !== hash(identity.token));
        });
        if (route.endsWith("/logout")) res.setHeader("Set-Cookie", cookie("", 0));
        return send(200, { ok: true });
      }
      const report = validateReport(data, time);
      const id = randomUUID();
      const result = await update(store, key, null, (state) => {
        stateFor(state, identity, req.headers["x-csrf-token"], true, time);
        const existing = state.cases.find((item) => item.report.assessmentId === report.assessmentId);
        if (existing) {
          if (JSON.stringify(existing.report) !== JSON.stringify(report))
            fail(409, "El identificador ya corresponde a otro reporte");
          return { duplicate: true, row: existing };
        }
        if (state.cases.length >= 200)
          fail(429, "Alcanzaste el máximo de 200 reportes del piloto. Puedes borrar tus reportes para continuar.");
        state.reportTimes = (state.reportTimes || state.cases.map((item) => item.created)).filter(
          (created) => created > time - HOUR,
        );
        if (state.reportTimes.length >= 30) fail(429, "Límite de reportes por hora alcanzado");
        state.reportTimes.push(time);
        const row = {
          id,
          state: "nuevo",
          created: time,
          updated: time,
          version: 1,
          report,
          provenance: "reportado_por_cliente_no_verificado",
        };
        state.cases.unshift(row);
        return { duplicate: false, row };
      });
      return send(result.duplicate ? 200 : 201, result.row);
    } catch (error) {
      // Never expose upstream responses, account state, credentials or report contents.
      if (error.public && error.status === 401) res.setHeader("Set-Cookie", cookie("", 0));
      return send(error.public ? error.status : 503, {
        error: error.public ? error.message : "No pudimos completar la operación. Vuelve a intentarlo.",
      });
    }
  };
}
