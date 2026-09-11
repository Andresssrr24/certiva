import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { accountKey, createReportsHandler, newAccount } from "../server/reports/service.mjs";
import { update } from "../server/reports/store.mjs";

const secret = "only-for-tests-32-characters-minimum-reports-secret";
const password = "test-only-long-random-password-1234";
function memory() {
  const rows = new Map();
  return {
    rows,
    async read(key) {
      return structuredClone(rows.get(key) || null);
    },
    async write(key, value, version) {
      const old = rows.get(key);
      if (old?.version !== version) return false;
      rows.set(key, { value: structuredClone(value), version: (old?.version || 0) + 1 });
      return true;
    },
  };
}
async function setup() {
  const store = memory();
  for (const name of ["first-client", "second-client"])
    await store.write(accountKey(name), await newAccount(name, password));
  let now = Date.now();
  const env = { REPORTS_ENABLED: "true", REPORTS_COOKIE_SECRET: secret };
  const call = async (route, method = "GET", body, session, headers = {}) => {
    const req = {
      url: `/api/reports/${route}`,
      method,
      body,
      headers: {
        "content-type": "application/json",
        "x-vercel-forwarded-for": "test-peer",
        ...(session ? { cookie: session.cookie, "x-csrf-token": session.csrf } : {}),
        ...headers,
      },
    };
    const res = {
      headers: {},
      setHeader(k, v) {
        this.headers[k] = v;
      },
      end(value) {
        this.value = JSON.parse(value);
      },
    };
    await createReportsHandler({ env, store, now: () => now })(req, res);
    return res;
  };
  const login = async (name = "first-client") => {
    const res = await call("login", "POST", { username: name, password });
    assert.equal(res.statusCode, 200);
    return { cookie: res.headers["Set-Cookie"].split(";")[0], csrf: res.value.csrf };
  };
  const report = () => ({
    assessmentId: randomUUID(),
    outcome: "riesgo",
    reasonCodes: ["pide_datos_sensibles"],
    channel: "sms",
    source: "texto",
    evaluatedAt: new Date(now).toISOString(),
    policyVersion: "ca-referencia-2026-09-v1",
    sdkVersion: "0.1.0",
    consent: true,
  });
  return {
    store,
    env,
    call,
    login,
    report,
    advance: (ms) => {
      now += ms;
    },
  };
}
test("HTTPS pilot login, persistent report, isolation and real logout", async () => {
  const f = await setup();
  const a = await f.login();
  const b = await f.login("second-client");
  const created = await f.call("cases", "POST", f.report(), a);
  assert.equal(created.statusCode, 201);
  assert.equal((await f.call("cases", "GET", undefined, a)).value.cases[0].id, created.value.id);
  assert.deepEqual((await f.call("cases", "GET", undefined, b)).value.cases, []);
  assert.equal((await f.call("cases")).statusCode, 401);
  assert.equal((await f.call("logout", "POST", undefined, a)).statusCode, 200);
  assert.equal((await f.call("cases", "GET", undefined, a)).statusCode, 401);
  assert.equal((await f.call("cases", "GET", undefined, b)).statusCode, 200);
});
test("encrypted cookies expire, cannot be modified and contain no plaintext user", async () => {
  const f = await setup();
  const a = await f.login();
  assert.ok(!a.cookie.includes("first-client"));
  assert.equal(
    (await f.call("cases", "GET", undefined, { ...a, cookie: a.cookie.slice(0, 40) + "tampered" })).statusCode,
    401,
  );
  f.advance(3600001);
  assert.equal((await f.call("cases", "GET", undefined, a)).statusCode, 401);
});
test("CSRF and foreign origin checks apply even with valid credentials or session", async () => {
  const f = await setup();
  const a = await f.login();
  for (const origin of ["null", "https://other.example"]) {
    assert.equal(
      (await f.call("login", "POST", { username: "first-client", password }, null, { origin })).statusCode,
      403,
    );
    assert.equal((await f.call("cases", "POST", f.report(), a, { origin })).statusCode, 403);
  }
  assert.equal((await f.call("cases", "POST", f.report(), { ...a, csrf: "" })).statusCode, 403);
  assert.equal((await f.call("logout", "POST", {}, { ...a, csrf: "wrong" })).statusCode, 403);
});
test("minimum data, consent and supported SDK reasons are enforced", async () => {
  const f = await setup();
  const a = await f.login();
  for (const changes of [
    { message: "private message" },
    { consent: false },
    { outcome: "sin_senales" },
    { reasonCodes: ["unknown"] },
    { source: "remote_ai" },
    { policyVersion: "other" },
  ]) {
    assert.equal((await f.call("cases", "POST", { ...f.report(), ...changes }, a)).statusCode, 400);
  }
  assert.equal(
    (await f.call("cases", "POST", { ...f.report(), reasonCodes: ["envio_para_recibir"] }, a)).statusCode,
    201,
  );
  assert.equal(
    (await f.call("cases", "POST", { ...f.report(), source: "qvac_texto", sdkVersion: "0.3.0-qvac" }, a)).statusCode,
    201,
  );
  assert.equal((await f.call("cases", "POST", "x".repeat(17000), a)).statusCode, 413);
});
test("concurrent identical submissions are idempotent and cannot overwrite another report", async () => {
  const f = await setup();
  const a = await f.login();
  const report = f.report();
  const results = await Promise.all([f.call("cases", "POST", report, a), f.call("cases", "POST", report, a)]);
  assert.deepEqual(results.map((r) => r.statusCode).sort(), [200, 201]);
  assert.equal(results[0].value.id, results[1].value.id);
  assert.equal((await f.call("cases", "POST", { ...report, channel: "otro" }, a)).statusCode, 409);
  const distinct = await Promise.all([f.call("cases", "POST", f.report(), a), f.call("cases", "POST", f.report(), a)]);
  assert.deepEqual(
    distinct.map((r) => r.statusCode),
    [201, 201],
  );
  assert.equal((await f.call("cases", "GET", undefined, a)).value.cases.length, 3);
});
test("report deletion requires confirmation and only clears the current account", async () => {
  const f = await setup();
  const a = await f.login();
  const b = await f.login("second-client");
  await f.call("cases", "POST", f.report(), a);
  await f.call("cases", "POST", f.report(), b);
  assert.equal((await f.call("erase", "POST", {}, a)).statusCode, 400);
  assert.equal((await f.call("erase", "POST", { confirm: true }, a)).statusCode, 200);
  assert.deepEqual((await f.call("cases", "GET", undefined, a)).value.cases, []);
  assert.equal((await f.call("cases", "GET", undefined, b)).value.cases.length, 1);
});
test("login limiter persists across new function instances and accepts no password bypass", async () => {
  const f = await setup();
  for (let i = 0; i < 20; i++)
    assert.equal((await f.call("login", "POST", { username: "missing-client", password })).statusCode, 401);
  assert.equal((await f.call("login", "POST", { username: "first-client", password })).statusCode, 429);
  f.advance(300001);
  await f.login();
});
test("storage failures and retry exhaustion fail closed with no private state leaked", async () => {
  const f = await setup();
  const a = await f.login();
  f.store.read = async () => {
    throw Object.assign(new Error("SECRET_STORAGE_TOKEN"), { status: 403 });
  };
  const res = await f.call("cases", "GET", undefined, a);
  assert.equal(res.statusCode, 503);
  assert.ok(!JSON.stringify(res).includes("SECRET_STORAGE_TOKEN"));
  await assert.rejects(
    update({ read: async () => null, write: async () => false }, "key", {}, () => 1),
    { status: 503 },
  );
});

test("erasing reports does not reset the hourly submission limit, including existing accounts", async () => {
  for (const legacy of [false, true]) {
    const f = await setup();
    const a = await f.login();
    for (let i = 0; i < 30; i++) assert.equal((await f.call("cases", "POST", f.report(), a)).statusCode, 201);
    if (legacy) delete f.store.rows.get(accountKey("first-client")).value.reportTimes;
    assert.equal((await f.call("erase", "POST", { confirm: true }, a)).statusCode, 200);
    assert.equal((await f.call("cases", "POST", f.report(), a)).statusCode, 429);
    f.advance(3600001);
    const renewed = await f.login();
    assert.equal((await f.call("cases", "POST", f.report(), renewed)).statusCode, 201);
  }
});
