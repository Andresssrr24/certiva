// Prueba de interfaz aislada: sin QVAC, datos privados ni apertura real de sitios.
const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const { fuentePorId } = require("../renderer/contactos-data");
app.setPath("userData", path.join(require("node:os").tmpdir(), "certiva-contactos-test-" + process.pid));
const abiertas = [];
ipcMain.handle("contactos-test", (_e, nombre, args) => {
  if (nombre === "estado")
    return {
      banco: { nombre: "Banco Demo" },
      modelos: {},
      sdk: "TEST",
      hardware: { cpu: "UI test", ram_gb: 16 },
      reportes: [],
    };
  if (nombre === "pares") return { estado: {}, log: [] };
  if (nombre === "red") return { nube: null, pares: 0, detalle: [] };
  if (nombre === "demoAuto") return {};
  if (nombre === "abrirFuenteContacto") {
    assert.ok(fuentePorId(args[0]));
    abiertas.push(args[0]);
    return true;
  }
  return [];
});
app
  .whenReady()
  .then(async () => {
    const w = new BrowserWindow({
      width: 1380,
      height: 920,
      show: false,
      webPreferences: {
        preload: path.join(root, "test/fixtures/contactos-preload.cjs"),
        contextIsolation: true,
        sandbox: true,
      },
    });
    await w.loadFile(path.join(root, "renderer/index.html"));
    const run = (code) => w.webContents.executeJavaScript(code);
    await new Promise((r) => setTimeout(r, 500));
    await run('pantalla("veredicto");document.querySelector("#tLlamar").click()');
    assert.equal(await run('document.querySelector("#tContacto").hidden'), false);
    assert.equal(await run('document.querySelector("#tLlamar").getAttribute("aria-expanded")'), "true");
    assert.equal(await run('document.querySelectorAll("#tContacto .contacto-card").length'), 3);
    assert.ok(await run('document.querySelector("#tContacto").textContent.includes("Consultado por IA")'));
    assert.ok(await run('document.querySelector("#tContacto .contactos-contexto").textContent.includes("Banco Demo")'));
    await run(
      'document.querySelector("#tContacto-numero").value="+507 6949-0076";document.querySelector("#tContacto form").requestSubmit()',
    );
    assert.ok(
      await run(
        'document.querySelector("#tContacto .contacto-estado").textContent.includes("Esto no confirma quién te llama")',
      ),
    );
    await run(
      'document.querySelector("#tContacto-numero").value="6623-6365";document.querySelector("#tContacto form").requestSubmit()',
    );
    assert.ok(
      await run('document.querySelector("#tContacto .contacto-estado").textContent.includes("no prueba fraude")'),
    );
    await run('document.querySelector("#tContacto .contacto-fuente").click()');
    await new Promise((r) => setTimeout(r, 100));
    assert.deepEqual(abiertas, ["seguridad"]);
    fs.mkdirSync(path.join(root, "tmp/contactos-qa"), { recursive: true });
    fs.writeFileSync(path.join(root, "tmp/contactos-qa/directorio.png"), (await w.webContents.capturePage()).toPNG());
    const bounds = await run(
      'JSON.stringify((()=>{const p=document.querySelector("#tContacto");return {ancho:p.clientWidth,contenido:p.scrollWidth};})())',
    );
    assert.ok(JSON.parse(bounds).contenido <= JSON.parse(bounds).ancho);
    await run('document.querySelector("#tLlamar").click()');
    assert.equal(await run('document.querySelector("#tContacto").hidden'), true);
    console.log(
      "PASS: tarjetas, procedencia, contexto demo, comparación, fuente por IPC, ancho y cierre. Sin inferencia.",
    );
    app.exit(0);
  })
  .catch((e) => {
    console.error(e);
    app.exit(1);
  });
