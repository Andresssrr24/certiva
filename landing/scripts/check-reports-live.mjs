import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

const credentials = JSON.parse(await readFile(process.argv[2], "utf8"));
const base = "https://certiva-landing.vercel.app/api/reports/";
let cookie = "",
  csrf = "";
async function call(route, method = "GET", body) {
  const res = await fetch(base + route, {
    method,
    redirect: "error",
    headers: { "Content-Type": "application/json", Cookie: cookie, "X-CSRF-Token": csrf },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(40000),
  });
  const data = await res.json();
  if (route === "login" && res.ok) {
    cookie = res.headers.get("set-cookie").split(";")[0];
    csrf = data.csrf;
  }
  return { status: res.status, data };
}
assert.equal((await call("health")).status, 200);
assert.equal((await call("cases")).status, 401);
assert.equal((await call("login", "POST", credentials)).status, 200);
const initial = await call("cases");
assert.equal(initial.status, 200);
assert.equal(initial.data.cases.length, 0, "Review account must be empty before test");
const report = {
  assessmentId: randomUUID(),
  outcome: "riesgo",
  reasonCodes: ["pide_datos_sensibles"],
  channel: "sms",
  source: "texto",
  evaluatedAt: new Date().toISOString(),
  policyVersion: "ca-referencia-2026-09-v1",
  sdkVersion: "0.1.0",
  consent: true,
};
const pair = await Promise.all([call("cases", "POST", report), call("cases", "POST", report)]);
assert.deepEqual(pair.map((item) => item.status).sort(), [200, 201]);
const submitted = pair[0];
assert.equal(pair[1].data.id, submitted.data.id);
assert.equal((await call("logout", "POST", {})).status, 200);
assert.equal((await call("cases")).status, 401);
assert.equal((await call("login", "POST", credentials)).status, 200);
const persisted = await call("cases");
assert.equal(persisted.data.cases[0].id, submitted.data.id);
assert.equal((await call("erase", "POST", { confirm: true })).status, 200);
assert.equal((await call("cases")).data.cases.length, 0);
assert.equal((await call("logout", "POST", {})).status, 200);
console.log(
  "LIVE HTTPS PASS: unauthenticated rejection, login, report, idempotency, persistent read after new login, erase, logout. Only synthetic test report used and removed; no credentials printed.",
);
