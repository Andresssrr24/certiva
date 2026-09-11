// Integration test with a controlled analysis fixture, not a QVAC accuracy benchmark.
const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
fs.mkdirSync(path.join(root, "tmp"), { recursive: true });
const { PilotCases } = require(root + "/lib/casos-piloto");
const store = new PilotCases(path.join(require("node:os").tmpdir(), "certiva-ui-cases-" + process.pid + ".json"));
const fixture = JSON.parse(fs.readFileSync(root + "/data/mensajes.json"));
const result = {
  ok: true,
  captura: {
    canal: "whatsapp",
    remitente: "+507 6623-6365",
    texto: "Envíe el código de verificación",
    enlaces: [],
    telefonos: [],
  },
  senales: [{ tipo: "pide_datos_sensibles", evidencia: "Solicita un código privado" }],
  veredicto_reglas: "fraude",
  veredicto: { veredicto: "fraude", accion: "No compartas tu código. Verifica desde la app del banco." },
};
ipcMain.handle("test-api", async (_, name, args) => {
  if (name === "estado")
    return {
      modelos: { vision: [{ key: "visionpsy-flash", enCache: true }], texto: [{ key: "qwen3-4b", enCache: true }] },
      sdk: "TEST",
      hardware: { cpu: "UI test", ram_gb: 16 },
      reportes: [],
    };
  if (name === "capturasDemo")
    return fixture.map((m) => ({ id: m.id, ruta: root + "/data/capturas/" + m.id + ".png", mensaje: m }));
  if (name === "casos") return store.list();
  if (name === "casoCrear") return store.create(args[0]);
  if (name === "casoAccion") return store.act(...args);
  if (name === "analizar") {
    await new Promise((r) => setTimeout(r, 800));
    return result;
  }
  if (name === "reportar") return [];
  if (name === "pares") return { estado: {}, log: [] };
  if (name === "red") return { nube: 0, pares: 0, detalle: [] };
  if (name === "demoAuto") return {};
});
app
  .whenReady()
  .then(async () => {
    const w = new BrowserWindow({
      width: 1380,
      height: 920,
      show: false,
      webPreferences: {
        preload: path.join(root, "test/fixtures/experience-preload.cjs"),
        contextIsolation: true,
        sandbox: true,
      },
    });
    const errors = [];
    w.webContents.on("console-message", (event) => {
      if (event.level === "error") errors.push(event.message);
    });
    await w.loadFile(root + "/renderer/index.html");
    const run = (s) => w.webContents.executeJavaScript(s);
    const pause = (ms) => new Promise((r) => setTimeout(r, ms));
    const check = async (s, label) => {
      if (!(await run(s))) throw new Error(label);
      console.log("PASS " + label);
    };
    await pause(1000);
    await check("!document.querySelector('[data-p=\"escritorio\"]').hidden", "starts outside app");
    fs.writeFileSync(root + "/tmp/portal-home.png", (await w.webContents.capturePage()).toPNG());
    await run('document.querySelectorAll(".ejemplo")[1].click()');
    await pause(100);
    await check(
      '!document.querySelector("#sourceNotification").hidden && !document.querySelector(\'[data-p="escritorio"]\').hidden',
      "incoming message over launcher",
    );
    await run('document.querySelector("#sourceNotification").click()');
    await check("!document.querySelector('[data-p=\"mensaje\"]').hidden", "source opens as WhatsApp");
    await pause(2000);
    await check(
      '!document.querySelector("#certivaNotification").hidden && document.querySelector(\'[data-p="veredicto"]\').hidden',
      "push does not open app automatically",
    );
    fs.writeFileSync(root + "/tmp/portal-push.png", (await w.webContents.capturePage()).toPNG());
    await run('document.querySelector("#certivaNotification").click()');
    await check(
      '!document.querySelector(\'[data-p="veredicto"]\').hidden && document.querySelector("#certivaNotification").hidden',
      "tap opens detailed analysis",
    );
    await run('document.querySelector("#tReportar").click()');
    await pause(200);
    await check('document.querySelectorAll(".case-row").length===1', "client report reaches bank");
    await run(
      "document.querySelector('[data-tab=\"banco\"]').click();document.querySelector('[data-case-action=\"assign\"]').click()",
    );
    await pause(200);
    await run("document.querySelector('[data-case-action=\"reset\"]').click()");
    await pause(200);
    fs.writeFileSync(root + "/tmp/portal-bank.png", (await w.webContents.capturePage()).toPNG());
    await check(
      'document.querySelector("#caseDetail").textContent.includes("sin ejecutar en el banco")',
      "bank measure persists as request",
    );
    await run("document.querySelector('[data-case-action=\"resolve\"]').click()");
    await pause(200);
    await check('document.querySelectorAll(".case-row").length===0', "resolved case leaves open inbox");
    await run(
      'document.querySelector("#caseFilter").value="all";document.querySelector("#caseFilter").dispatchEvent(new Event("change"))',
    );
    await check('document.querySelectorAll(".case-row").length===1', "closed case remains auditable");
    await w.setSize(1000, 720);
    await pause(300);
    fs.writeFileSync(root + "/tmp/portal-bank-small.png", (await w.webContents.capturePage()).toPNG());
    if (errors.length) throw Error(errors.join("\n"));
    fs.unlinkSync(store.file);
    app.exit(0);
  })
  .catch((e) => {
    console.error(e);
    app.exit(1);
  });
