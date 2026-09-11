"use strict";
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");
const SDK = require("./sdk");
const POLICY_VERSION = "ca-referencia-2026-09-v1";
const REPORT_KEYS = ["assessmentId", "outcome", "reasonCodes", "channel", "source", "evaluatedAt", "policyVersion", "sdkVersion", "consent"].sort();
const RESOLUTIONS = ["fraude_confirmado", "legitimo", "sin_evidencia"];
const allowedFiles = {
  "/": ["index.html", "text/html"], "/app.js": ["app.js", "text/javascript"],
  "/styles.css": ["styles.css", "text/css"], "/certiva.js": ["certiva.js", "text/javascript"],
  "/policy-key.js": ["policy-key.js", "text/javascript"], "/policy.json": ["policy.json", "application/json"],
  "/brand.png": ["brand.png", "image/png"], "/manrope-800.ttf": ["manrope-800.ttf", "font/ttf"],
};
function fail(status, message) { const error = new Error(message); error.status = status; throw error; }
function hash(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function passwordHash(password, salt) { return crypto.scryptSync(password, salt, 32).toString("hex"); }
function initialize(file, accounts) {
  const db = new DatabaseSync(file);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=3000;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, tenant TEXT NOT NULL, role TEXT NOT NULL, salt TEXT NOT NULL, password TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), csrf TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS cases(id TEXT PRIMARY KEY, tenant TEXT NOT NULL, actor TEXT NOT NULL, assessment TEXT NOT NULL,
      report TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'nuevo', assignee TEXT, resolution TEXT,
      created INTEGER NOT NULL, updated INTEGER NOT NULL, version INTEGER NOT NULL DEFAULT 1, UNIQUE(tenant,actor,assessment));
    CREATE TABLE IF NOT EXISTS audit(seq INTEGER PRIMARY KEY AUTOINCREMENT, tenant TEXT NOT NULL, actor TEXT NOT NULL,
      case_id TEXT, event TEXT NOT NULL, created INTEGER NOT NULL, detail TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS cases_tenant ON cases(tenant,created);
    CREATE INDEX IF NOT EXISTS audit_tenant ON audit(tenant,seq);`);
  const insert = db.prepare("INSERT OR IGNORE INTO users VALUES(?,?,?,?,?)");
  for (const account of accounts || []) {
    if (!["cliente", "analista", "auditor"].includes(account.role)) throw new Error("Rol inválido");
    const salt = crypto.randomBytes(16).toString("hex");
    insert.run(account.id, account.tenant, account.role, salt, passwordHash(account.password, salt));
  }
  return db;
}
function createApp({ file = ":memory:", accounts = [] } = {}) {
  const db = initialize(file, accounts);
  const attempts = new Map();
  const dummySalt = crypto.randomBytes(16).toString("hex");
  function audit(user, caseId, event, detail = {}) {
    db.prepare("INSERT INTO audit(tenant,actor,case_id,event,created,detail) VALUES(?,?,?,?,?,?)")
      .run(user.tenant, user.id, caseId, event, Date.now(), JSON.stringify(detail));
  }
  function transaction(fn) {
    db.exec("BEGIN IMMEDIATE");
    try { const result = fn(); db.exec("COMMIT"); return result; }
    catch (error) { db.exec("ROLLBACK"); throw error; }
  }
  function session(req) {
    const value = /(?:^|;\s*)certiva=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || "")?.[1];
    if (!value) fail(401, "Inicia sesión para continuar");
    const user = db.prepare("SELECT u.id,u.tenant,u.role,s.csrf,s.id AS session_id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.expires>?").get(hash(value), Date.now());
    if (!user) fail(401, "La sesión venció. Vuelve a ingresar");
    if (!["GET", "HEAD"].includes(req.method) && req.headers["x-csrf-token"] !== user.csrf) fail(403, "Verificación de sesión inválida");
    return user;
  }
  function getCase(user, id) {
    const row = db.prepare("SELECT * FROM cases WHERE id=? AND tenant=?").get(id, user.tenant);
    if (!row || (user.role === "cliente" && row.actor !== user.id)) fail(404, "Caso no encontrado");
    return row;
  }
  function project(row, role) {
    const result = { id: row.id, state: row.state, created: row.created, updated: row.updated, version: row.version,
      report: JSON.parse(row.report), provenance: "reportado_por_cliente_no_verificado" };
    if (role !== "cliente") Object.assign(result, { assignee: row.assignee, resolution: row.resolution });
    return result;
  }
  async function body(req) {
    if (!(req.headers["content-type"] || "").startsWith("application/json")) fail(415, "Se requiere JSON");
    let text = ""; let size = 0;
    for await (const chunk of req) { size += chunk.length; if (size > 16384) fail(413, "Solicitud demasiado grande"); text += chunk; }
    try { const data = JSON.parse(text); if (!data || Array.isArray(data) || typeof data !== "object") fail(400, "JSON inválido"); return data; }
    catch { fail(400, "JSON inválido"); }
  }
  function validateReport(data) {
    const supportedEngine = (SDK.SOURCES.includes(data.source) && data.sdkVersion === SDK.VERSION) ||
      (data.source === "qvac_texto" && data.sdkVersion === "0.3.0-qvac");
    if (JSON.stringify(Object.keys(data).sort()) !== JSON.stringify(REPORT_KEYS)) fail(400, "Solo se admiten los campos mínimos del reporte");
    if (!SDK.isUUID(data.assessmentId) || data.consent !== true || !Object.hasOwn(SDK.LABELS, data.outcome) ||
        !SDK.CHANNELS.includes(data.channel) || !supportedEngine ||
        data.policyVersion !== POLICY_VERSION ||
        !Array.isArray(data.reasonCodes) || data.reasonCodes.length > Object.keys(SDK.REASONS).length ||
        data.reasonCodes.some(code => !Object.hasOwn(SDK.REASONS, code)) || new Set(data.reasonCodes).size !== data.reasonCodes.length ||
        typeof data.evaluatedAt !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(data.evaluatedAt) ||
        !Number.isFinite(Date.parse(data.evaluatedAt)) || Date.parse(data.evaluatedAt) > Date.now() + 300000 || Date.parse(data.evaluatedAt) < Date.now() - 86400000) fail(400, "Reporte inválido o vencido. Vuelve a verificar el mensaje");
    const codes = data.reasonCodes;
    const expected = codes.some(c => ["politica_vencida", "lectura_incompleta"].includes(c)) ? "no_concluyente" :
      codes.some(c => ["pide_datos_sensibles", "dominio_parecido", "pago_terceros", "envio_para_recibir", "cambio_direccion"].includes(c)) ? "riesgo" : codes.length ? "revisar" : "sin_senales";
    if (data.outcome !== expected) fail(400, "El resultado no coincide con sus motivos");
  }
  const server = http.createServer(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const send = (status, data, headers = {}) => { res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers }); res.end(JSON.stringify(data)); };
    try {
      const expectedHost = `127.0.0.1:${server.address().port}`;
      if (req.headers.host !== expectedHost) fail(403, "Host no permitido; usa 127.0.0.1");
      if (req.headers.origin && req.headers.origin !== `http://${expectedHost}`) fail(403, "Origen no permitido");
      if (req.headers["sec-fetch-site"] === "cross-site") fail(403, "Origen no permitido");
      const url = new URL(req.url, `http://${expectedHost}`);
      if (req.method === "GET" && allowedFiles[url.pathname]) {
        const [name, mime] = allowedFiles[url.pathname];
        res.writeHead(200, { "Content-Type": `${mime}; charset=utf-8` });
        res.end(fs.readFileSync(path.join(__dirname, "public", name))); return;
      }
      if (url.pathname === "/api/login" && req.method === "POST") {
        // One limiter per local peer. Bounds attempts even when account names vary.
        const peer = req.socket.remoteAddress;
        const now = Date.now();
        const count = attempts.get(peer);
        if (count && count.until > now && count.total >= 10) fail(429, "Demasiados intentos. Espera 5 minutos");
        const data = await body(req);
        if (typeof data.username !== "string" || data.username.length > 100 || typeof data.password !== "string" || data.password.length > 200) fail(400, "Credenciales inválidas");
        const user = db.prepare("SELECT * FROM users WHERE id=?").get(data.username);
        const check = passwordHash(data.password, user?.salt || dummySalt);
        if (!user || !crypto.timingSafeEqual(Buffer.from(check, "hex"), Buffer.from(user.password, "hex"))) {
          attempts.set(peer, { until: count?.until > now ? count.until : now + 300000, total: count?.until > now ? count.total + 1 : 1 });
          fail(401, "Usuario o contraseña incorrectos");
        }
        attempts.delete(peer);
        const token = crypto.randomBytes(32).toString("hex"); const csrf = crypto.randomBytes(24).toString("hex");
        const old = /(?:^|;\s*)certiva=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || "")?.[1];
        transaction(() => {
          if (old) db.prepare("DELETE FROM sessions WHERE id=?").run(hash(old));
          db.prepare("DELETE FROM sessions WHERE expires<=?").run(now);
          db.prepare("INSERT INTO sessions VALUES(?,?,?,?)").run(hash(token), user.id, csrf, now + 3600000);
          audit(user, null, "sesion_iniciada");
        });
        send(200, { id: user.id, role: user.role, csrf }, { "Set-Cookie": `certiva=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600` }); return;
      }
      if (!url.pathname.startsWith("/api/")) fail(404, "Ruta no encontrada");
      const user = session(req);
      if (url.pathname === "/api/session" && req.method === "GET") { send(200, { id: user.id, role: user.role, csrf: user.csrf }); return; }
      if (url.pathname === "/api/logout" && req.method === "POST") {
        transaction(() => { db.prepare("DELETE FROM sessions WHERE id=?").run(user.session_id); audit(user, null, "sesion_cerrada"); });
        send(200, { ok: true }, { "Set-Cookie": "certiva=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0" }); return;
      }
      if (url.pathname === "/api/cases" && req.method === "POST") {
        if (user.role !== "cliente") fail(403, "Solo el cliente puede enviar reportes");
        const data = await body(req); validateReport(data);
        const result = transaction(() => {
          const existing = db.prepare("SELECT * FROM cases WHERE tenant=? AND actor=? AND assessment=?").get(user.tenant, user.id, data.assessmentId);
          const canonical = JSON.stringify(Object.fromEntries(REPORT_KEYS.map(key => [key, data[key]])));
          if (existing) { if (existing.report !== canonical) fail(409, "El identificador ya corresponde a otro reporte"); return { row: existing, duplicate: true }; }
          const count = db.prepare("SELECT count(*) n FROM cases WHERE actor=? AND tenant=? AND created>?").get(user.id, user.tenant, Date.now() - 3600000).n;
          if (count >= 30) fail(429, "Límite de reportes por hora alcanzado");
          const id = crypto.randomUUID(); const now = Date.now();
          db.prepare("INSERT INTO cases(id,tenant,actor,assessment,report,created,updated) VALUES(?,?,?,?,?,?,?)").run(id, user.tenant, user.id, data.assessmentId, canonical, now, now);
          audit(user, id, "reporte_recibido", { consent: true, provenance: "cliente_no_verificado" });
          return { row: getCase(user, id), duplicate: false };
        });
        send(result.duplicate ? 200 : 201, project(result.row, user.role)); return;
      }
      if (url.pathname === "/api/cases" && req.method === "GET") {
        const rows = user.role === "cliente" ? db.prepare("SELECT * FROM cases WHERE tenant=? AND actor=? ORDER BY created DESC LIMIT 200").all(user.tenant, user.id) : db.prepare("SELECT * FROM cases WHERE tenant=? ORDER BY created DESC LIMIT 200").all(user.tenant);
        audit(user, null, "bandeja_consultada", { count: rows.length });
        send(200, { cases: rows.map(row => project(row, user.role)), limit: 200 }); return;
      }
      const match = /^\/api\/cases\/([a-f0-9-]{36})$/.exec(url.pathname);
      if (match && req.method === "PATCH") {
        if (user.role !== "analista") fail(403, "Solo un analista puede gestionar casos");
        const data = await body(req);
        if (Object.keys(data).some(key => !["version", "action", "resolution"].includes(key)) || !Number.isInteger(data.version)) fail(400, "Cambio inválido");
        const row = transaction(() => {
          const old = getCase(user, match[1]);
          if (old.version !== data.version) fail(409, "Otro analista actualizó el caso. Recarga la bandeja");
          let state; let assignee; let resolution;
          if (data.action === "tomar" && old.state === "nuevo" && !data.resolution) { state = "en_revision"; assignee = user.id; resolution = null; }
          else if (data.action === "resolver" && old.state === "en_revision" && old.assignee === user.id && RESOLUTIONS.includes(data.resolution)) { state = "resuelto"; assignee = user.id; resolution = data.resolution; }
          else fail(409, "Transición no permitida; toma el caso antes de resolverlo");
          db.prepare("UPDATE cases SET state=?,assignee=?,resolution=?,updated=?,version=version+1 WHERE id=? AND tenant=?").run(state, assignee, resolution, Date.now(), old.id, user.tenant);
          audit(user, old.id, data.action === "tomar" ? "caso_asignado" : "caso_resuelto", { resolution });
          return getCase(user, old.id);
        });
        send(200, project(row, user.role)); return;
      }
      if (url.pathname === "/api/audit" && req.method === "GET") {
        if (user.role === "cliente") fail(403, "Acceso restringido al equipo autorizado");
        audit(user, null, "auditoria_consultada");
        send(200, { events: db.prepare("SELECT seq,actor,case_id,event,created,detail FROM audit WHERE tenant=? ORDER BY seq DESC LIMIT 200").all(user.tenant) }); return;
      }
      fail(404, "Ruta no encontrada");
    } catch (error) {
      if (!res.headersSent) send(error.status || 500, { error: error.status ? error.message : "No pudimos completar la operación" });
      else res.end();
    }
  });
  server.requestTimeout = 15000; server.headersTimeout = 10000;
  return { server, db, close: () => new Promise(resolve => server.close(() => { db.close(); resolve(); })) };
}
if (require.main === module) {
  process.umask(0o077);
  const folder = process.env.CERTIVA_PILOT_DATA || path.join(os.homedir(), "Library/Application Support/CertivaPilot");
  fs.mkdirSync(folder, { recursive: true, mode: 0o700 });
  const bootstrap = path.join(folder, "accesos-locales.json");
  if (!fs.existsSync(bootstrap)) {
    const accounts = ["cliente", "analista", "auditor"].map(role => ({ id: role, tenant: "caja-piloto", role, password: crypto.randomBytes(18).toString("base64url") }));
    fs.writeFileSync(bootstrap, JSON.stringify(accounts, null, 2), { mode: 0o600 });
  }
  const app = createApp({ file: path.join(folder, "cases.sqlite"), accounts: JSON.parse(fs.readFileSync(bootstrap, "utf8")) });
  const port = Number(process.env.CERTIVA_PILOT_PORT || 4320);
  app.server.listen(port, "127.0.0.1", () => {
    console.log(`Certiva · piloto local: http://127.0.0.1:${app.server.address().port}`);
    console.log(`Accesos de prueba (archivo privado): ${bootstrap}`);
  });
  for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, async () => { await app.close(); process.exit(0); });
}
module.exports = { createApp };
