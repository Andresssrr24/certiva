"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { PilotCases } = require("../lib/casos-piloto");
function store(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "certiva-cases-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return new PilotCases(path.join(dir, "cases.json"));
}
test("case lifecycle persists and does not execute bank actions", (t) => {
  const s = store(t);
  const [c] = s.create({ type: "otp", source: "simulacion" });
  assert.throws(() => s.act(c.id, "revoke"), /Asigna/);
  s.act(c.id, "assign");
  assert.throws(() => s.act(c.id, "resolve"), /respuesta/);
  s.act(c.id, "revoke");
  assert.throws(() => s.act(c.id, "revoke"), /ya está/);
  s.act(c.id, "resolve");
  assert.throws(() => s.act(c.id, "reset"), /cerrado/);
  const [restored] = new PilotCases(s.file).list();
  assert.equal(restored.state, "resolved");
  assert.equal(restored.audit.length, 4);
  assert.match(restored.audit[2].label, /sin ejecutar/);
});
test("cases reject message contents and invalid actions", (t) => {
  const s = store(t);
  assert.throws(() => s.create({ type: "otp", source: "reporte_cliente", text: "private" }), /no admite/);
  assert.throws(() => s.create({ type: "login", source: "reporte_cliente" }), /simulación/);
  assert.throws(() => s.create({ type: "__proto__", source: "simulacion" }), /inválido/);
  const [c] = s.create({ type: "phishing", source: "reporte_cliente" });
  assert.throws(() => s.act(c.id, "__proto__"), /no admitida/);
  const copy = s.list();
  copy[0].state = "resolved";
  assert.equal(s.list()[0].state, "new");
});
test("discard requires an assigned analyst and survives restart", (t) => {
  const s = store(t);
  const [c] = s.create({ type: "attempts", source: "simulacion" });
  assert.throws(() => s.act(c.id, "dismiss"), /Asigna/);
  s.act(c.id, "assign");
  s.act(c.id, "dismiss");
  assert.equal(new PilotCases(s.file).list()[0].state, "dismissed");
});
