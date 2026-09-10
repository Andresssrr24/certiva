"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
test("dataset externo guarda manifiesto y no infla campos vacíos", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "antifraude-eval-test-"));
  try {
    fs.mkdirSync(path.join(dir, "capturas"));
    fs.writeFileSync(path.join(dir, "capturas", "caso.png"), "fixture: no es una captura real");
    fs.writeFileSync(
      path.join(dir, "verdad.json"),
      JSON.stringify({
        caso: {
          canal: "sms",
          remitente: "Banco",
          texto: "Hola",
          enlaces: [],
          telefonos: [],
          esperado: { veredicto: "fraude" },
        },
      }),
    );
    const preload = path.join(dir, "doble.cjs");
    fs.writeFileSync(
      preload,
      `const Module = require('node:module');
const original = Module._load;
Module._load = function(id, ...args) {
 if (id === '../lib/analizar') return { Motor: class {
 async analizar() { return { ok: true, captura: { canal:'sms', remitente:'', texto:'Hola', enlaces:[], telefonos:['123'] }, veredicto:{veredicto:'no_legible'}, tiempos:{total_ms:123} }; }
 async descargarTodo() {}
 } };
 return original.call(this, id, ...args);
};`,
    );
    const salida = path.join(dir, "salida");
    execFileSync(process.execPath, ["--require", preload, path.resolve("eval/evaluar.js")], {
      env: { ...process.env, EVAL_DATASET: dir, EVAL_OUTPUT: salida },
    });
    const manifest = JSON.parse(fs.readFileSync(path.join(salida, "manifest.json")));
    assert.equal(manifest.externo, true);
    assert.equal(manifest.archivos["capturas/caso.png"].length, 64);
    const md = fs.readFileSync(path.join(salida, "results.md"), "utf8");
    assert.match(md, /Abstenciones: 1\/1/);
    assert.match(md, /Falsos negativos de fraude.*1\/1/);
    assert.match(md, /\| remitente \| 0.0%/);
    assert.match(md, /\| telefonos \| 0.0%/);
    assert.match(md, /Latencia total mediana: 123 ms/);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});
