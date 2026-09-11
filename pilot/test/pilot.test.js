const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const http = require("node:http");
const vm = require("node:vm");
const SDK = require("../sdk");
const { createApp } = require("../server");
const envelope = require("../public/policy.json");
const policy = JSON.parse(Buffer.from(envelope.payload, "base64").toString());
const text = "Tu cuenta será bloqueada. Envíe el código de verificación al atacante.";
const fixedNow = Date.parse("2026-09-11T12:00:00Z");
function assess(value = text, extra = {}) {
  return SDK.assess(
    { id: crypto.randomUUID(), text: value, channel: "whatsapp", source: "texto", now: fixedNow, ...extra },
    policy,
  );
}
test("texto sospechoso y negaciones legítimas no reciben el mismo resultado", () => {
  assert.equal(assess().outcome, "riesgo");
  assert.equal(
    assess("Tu estado de cuenta está disponible. Nunca compartas claves ni códigos.").outcome,
    "sin_senales",
  );
  assert.equal(assess("No comparta su código con nadie. Consulte su estado mensual.").outcome, "sin_senales");
});
test("lectura vacía, OCR sin confirmar y política vencida se abstienen", () => {
  for (const result of [
    assess("hola"),
    assess(text, { source: "apple_vision" }),
    assess(text, { now: Date.parse("2027-01-01") }),
  ])
    assert.equal(result.outcome, "no_concluyente");
});
test("un enlace reconocido no autentica al remitente", () => {
  const result = assess("Consulta novedades en https://www.cajadeahorros.com.pa");
  assert.equal(result.outcome, "sin_senales");
  assert.match(result.action, /no confirma/);
});
test("un registro sin teléfonos aprobados no acusa a todo número de ser ajeno", () => {
  assert.ok(!assess("Información del banco: consulta al 800-2252").reasons.some((r) => r.code === "numero_no_oficial"));
});
test("el reporte excluye texto, enlaces y números aun si se agregan al resultado", () => {
  const result = assess();
  Object.assign(result, { text, url: "https://malicioso.example", phone: "6000-0000" });
  const report = SDK.makeReport(result);
  assert.deepEqual(
    Object.keys(report).sort(),
    [
      "assessmentId",
      "outcome",
      "reasonCodes",
      "channel",
      "source",
      "evaluatedAt",
      "policyVersion",
      "sdkVersion",
      "consent",
    ].sort(),
  );
  for (const secret of ["atacante", "malicioso", "6000-0000"]) assert.ok(!JSON.stringify(report).includes(secret));
});
test("el paquete ejecuta sin require, red o APIs de Node y conserva resultados", () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../public/certiva.js"), "utf8"), context);
  const input = { id: crypto.randomUUID(), text, channel: "sms", source: "texto", now: fixedNow };
  assert.equal(JSON.stringify(context.Certiva.assess(input, policy)), JSON.stringify(SDK.assess(input, policy)));
});
const accounts = [
  { id: "client-a", tenant: "bank-a", role: "cliente", password: "test-password" },
  { id: "client-b", tenant: "bank-b", role: "cliente", password: "test-password" },
  { id: "other-client-a", tenant: "bank-a", role: "cliente", password: "test-password" },
  { id: "analyst-a", tenant: "bank-a", role: "analista", password: "test-password" },
  { id: "analyst-b", tenant: "bank-b", role: "analista", password: "test-password" },
  { id: "auditor-a", tenant: "bank-a", role: "auditor", password: "test-password" },
];
async function setup(t, options = {}) {
  const app = createApp({ accounts, ...options });
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  t.after(() => app.close());
  const base = `http://127.0.0.1:${app.server.address().port}`;
  async function login(username) {
    const response = await fetch(base + "/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password: "test-password" }),
    });
    assert.equal(response.status, 200);
    const user = await response.json();
    return { cookie: response.headers.get("set-cookie").split(";")[0], csrf: user.csrf };
  }
  async function request(who, url, method = "GET", data, headers = {}) {
    const response = await fetch(base + url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Cookie: who?.cookie || "",
        "X-CSRF-Token": who?.csrf || "",
        ...headers,
      },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
    return { status: response.status, body: await response.json() };
  }
  return { ...app, base, login, request };
}
function report() {
  return { ...SDK.makeReport(assess()), evaluatedAt: new Date().toISOString() };
}
test("reporte → asignación → resolución, con auditoría y sin texto persistido", async (t) => {
  const a = await setup(t);
  const client = await a.login("client-a");
  const analyst = await a.login("analyst-a");
  const created = await a.request(client, "/api/cases", "POST", report());
  assert.equal(created.status, 201);
  const id = created.body.id;
  assert.equal(
    (
      await a.request(analyst, `/api/cases/${id}`, "PATCH", {
        version: 1,
        action: "resolver",
        resolution: "fraude_confirmado",
      })
    ).status,
    409,
  );
  const taken = await a.request(analyst, `/api/cases/${id}`, "PATCH", { version: 1, action: "tomar" });
  assert.equal(taken.body.state, "en_revision");
  const closed = await a.request(analyst, `/api/cases/${id}`, "PATCH", {
    version: 2,
    action: "resolver",
    resolution: "sin_evidencia",
  });
  assert.equal(closed.body.state, "resuelto");
  const audit = await a.request(analyst, "/api/audit");
  assert.ok(audit.body.events.some((e) => e.event === "caso_resuelto"));
  assert.ok(!JSON.stringify(a.db.prepare("SELECT * FROM cases").all()).includes("atacante"));
});
test("reportes idempotentes, conflictos de contenido y concurrencia", async (t) => {
  const a = await setup(t);
  const client = await a.login("client-a");
  const analyst = await a.login("analyst-a");
  const data = report();
  const first = await a.request(client, "/api/cases", "POST", data);
  const repeat = await a.request(client, "/api/cases", "POST", data);
  assert.equal(repeat.status, 200);
  assert.equal(repeat.body.id, first.body.id);
  assert.equal((await a.request(client, "/api/cases", "POST", { ...data, channel: "sms" })).status, 409);
  await a.request(analyst, `/api/cases/${first.body.id}`, "PATCH", { version: 1, action: "tomar" });
  assert.equal(
    (await a.request(analyst, `/api/cases/${first.body.id}`, "PATCH", { version: 1, action: "tomar" })).status,
    409,
  );
});
test("aislamiento de bancos, de clientes y permisos de auditor", async (t) => {
  const a = await setup(t);
  const client = await a.login("client-a");
  const created = await a.request(client, "/api/cases", "POST", report());
  for (const id of ["client-b", "other-client-a", "analyst-b"]) {
    const user = await a.login(id);
    assert.equal((await a.request(user, "/api/cases")).body.cases.length, 0);
  }
  const other = await a.login("analyst-b");
  assert.equal(
    (await a.request(other, `/api/cases/${created.body.id}`, "PATCH", { version: 1, action: "tomar" })).status,
    404,
  );
  const auditor = await a.login("auditor-a");
  assert.equal(
    (await a.request(auditor, `/api/cases/${created.body.id}`, "PATCH", { version: 1, action: "tomar" })).status,
    403,
  );
  assert.equal((await a.request(client, "/api/audit")).status, 403);
});
test("rechaza contenido privado adicional, consentimiento ausente, versiones y resultados inválidos", async (t) => {
  const a = await setup(t);
  const client = await a.login("client-a");
  for (const extra of [
    { text },
    { tenant: "bank-b" },
    { consent: false },
    { sdkVersion: "fake" },
    { outcome: "sin_senales" },
    { reasonCodes: ["<script>"] },
    { evaluatedAt: "ayer" },
  ]) {
    assert.equal((await a.request(client, "/api/cases", "POST", { ...report(), ...extra })).status, 400);
  }
});
test("sin sesión, CSRF, origen cruzado, host ajeno y sesión cerrada", async (t) => {
  const a = await setup(t);
  assert.equal((await a.request(null, "/api/cases")).status, 401);
  const client = await a.login("client-a");
  assert.equal((await a.request({ ...client, csrf: "wrong" }, "/api/cases", "POST", report())).status, 403);
  assert.equal((await a.request(client, "/api/cases", "GET", null, { Origin: "https://evil.example" })).status, 403);
  const hostStatus = await new Promise((resolve, reject) => {
    http
      .get(a.base + "/api/cases", { headers: { Host: "evil.example", Cookie: client.cookie } }, (response) => {
        response.resume();
        resolve(response.statusCode);
      })
      .on("error", reject);
  });
  assert.equal(hostStatus, 403);
  await a.request(client, "/api/logout", "POST");
  assert.equal((await a.request(client, "/api/cases")).status, 401);
});
test("límite de reportes por usuario y cuerpo máximo", async (t) => {
  const a = await setup(t);
  const client = await a.login("client-a");
  assert.equal((await a.request(client, "/api/cases", "POST", { text: "x".repeat(17000) })).status, 413);
  for (let i = 0; i < 30; i++) assert.equal((await a.request(client, "/api/cases", "POST", report())).status, 201);
  assert.equal((await a.request(client, "/api/cases", "POST", report())).status, 429);
});
test("los casos persisten al volver a abrir la base", async (t) => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), "certiva-test-"));
  t.after(() => fs.rmSync(folder, { recursive: true, force: true }));
  const file = path.join(folder, "cases.sqlite");
  const first = createApp({ file, accounts });
  first.db
    .prepare("INSERT INTO cases(id,tenant,actor,assessment,report,created,updated) VALUES(?,?,?,?,?,?,?)")
    .run(crypto.randomUUID(), "bank-a", "client-a", crypto.randomUUID(), "{}", Date.now(), Date.now());
  first.db.close();
  const second = createApp({ file });
  assert.equal(second.db.prepare("SELECT count(*) n FROM cases").get().n, 1);
  second.db.close();
});

test("señales de pago conservan explicación y paridad en web, iOS y Android", () => {
  const samples = [
    ["Envíe 100 para recibir su beneficio.", "envio_para_recibir"],
    ["Use la nueva dirección de pago indicada por su proveedor.", "cambio_direccion"],
  ];
  for (const resource of [
    "public/certiva.js",
    "ios/Sources/CertivaSDK/Resources/certiva.js",
    "android-app/sdk/src/main/assets/certiva.js",
  ]) {
    const context = vm.createContext({});
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", resource), "utf8"), context);
    for (const [text, code] of samples) {
      const input = { id: crypto.randomUUID(), text, channel: "sms", source: "texto", now: fixedNow };
      const result = SDK.assess(input, policy);
      assert.equal(result.outcome, "riesgo");
      assert.ok(result.reasons.some((reason) => reason.code === code && reason.title));
      assert.equal(JSON.stringify(context.Certiva.assess(input, policy)), JSON.stringify(result), resource);
    }
  }
});

test("la consola acepta las señales de pago emitidas por el motor vigente", async (t) => {
  const app = await setup(t);
  const client = await app.login("client-a");
  for (const message of [
    "Envíe 100 para recibir su beneficio.",
    "Use la nueva dirección de pago indicada por su proveedor.",
  ]) {
    const result = assess(message, { now: Date.now() });
    assert.equal(result.outcome, "riesgo");
    const response = await app.request(client, "/api/cases", "POST", SDK.makeReport(result));
    assert.equal(response.status, 201);
    assert.deepEqual(
      response.body.report.reasonCodes,
      result.reasons.map((reason) => reason.code),
    );
  }
});

test("QVAC Android conserva procedencia y minimización; rechaza pares motor/fuente incompatibles", async (t) => {
  const a = await setup(t);
  const client = await a.login("client-a");
  const local = { ...report(), source: "qvac_texto", sdkVersion: "0.3.0-qvac" };
  const created = await a.request(client, "/api/cases", "POST", local);
  assert.equal(created.status, 201);
  const stored = (await a.request(client, "/api/cases")).body.cases.find((item) => item.id === created.body.id);
  assert.equal(stored.report.source, "qvac_texto");
  assert.equal(stored.report.sdkVersion, "0.3.0-qvac");
  for (const extra of [
    { sdkVersion: SDK.VERSION },
    { source: "texto" },
    { text: "do-not-store" },
    { reasonCodes: ["unapproved_ai_signal"] },
  ]) {
    assert.equal(
      (await a.request(client, "/api/cases", "POST", { ...local, assessmentId: crypto.randomUUID(), ...extra })).status,
      400,
    );
  }
});
