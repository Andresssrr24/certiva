import { analyzeText, EXAMPLES, PRESENTATION } from "./analyzer.js";

const $ = (selector) => document.querySelector(selector);
const state = { mode: "text", token: "", connected: false, busy: false, last: null };
const resultEmpty = $("#result").innerHTML;
const escape = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch],
  );
function resetResult() {
  state.last = null;
  $("#result").innerHTML = resultEmpty;
  $("#form-status").textContent = "";
}
function setMode(mode) {
  if (state.busy) return;
  state.mode = mode;
  document.querySelectorAll("[data-mode]").forEach((b) => {
    const active = b.dataset.mode === mode;
    b.classList.toggle("selected", active);
    b.setAttribute("aria-pressed", String(active));
  });
  $("#text-input").hidden = mode !== "text";
  $("#image-input").hidden = mode !== "image";
  $("#analyze").textContent = mode === "image" ? "Analizar captura con QVAC ↗" : "Analizar mensaje ↗";
  resetResult();
}
function renderResult(result) {
  const p = PRESENTATION[result.verdict] || PRESENTATION.no_legible;
  state.last = result;
  $("#engine-label").textContent = result.engine === "qvac" ? "QVAC LOCAL" : "REGLAS LOCALES";
  $("#result").innerHTML =
    `<article class="result-card"><span class="result-state ${result.verdict === "sin_senales" ? "neutral" : ""}">${p.badge}</span><h3>${p.title}</h3><p>${p.action}</p>${result.signals.length ? `<ul class="signals">${result.signals.map((s) => `<li><div><strong>${escape(s.title || "Señal detectada")}</strong><br>${escape(s.evidence)}</div></li>`).join("")}</ul>` : ""}${result.explanation ? `<p><strong>Explicación QVAC:</strong> ${escape(result.explanation)}</p>` : ""}<div class="result-actions"><a class="button" href="tel:8002252">Llamar al 800-2252 ↗</a><button class="quiet" id="download" type="button">Descargar resultado</button></div><p class="result-meta">${result.engine === "qvac" ? "Procesado con QVAC en tu equipo" : "Análisis de reglas en tu navegador"} · ${result.elapsedMs} ms<br>Orientación preventiva. No es una confirmación de autenticidad.</p></article>`;
  $("#download").addEventListener("click", downloadResult);
}
function downloadResult() {
  if (!state.last) return;
  const { verdict, signals, domains, engine, elapsedMs } = state.last;
  const content = {
    producto: "Certiva",
    fecha: new Date().toISOString(),
    resultado: verdict,
    senales: signals,
    dominios: domains,
    motor: engine,
    tiempo_ms: elapsedMs,
    nota: "Informe local, no enviado al banco. No incluye el mensaje completo. Los dominios pueden formar parte de las evidencias.",
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "certiva-resultado.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function disconnect() {
  state.connected = false;
  state.token = "";
  $("#pair-token").value = "";
  $("#connection-badge").textContent = "Desconectado";
  $("#disconnect").hidden = true;
  $("#engine-label").textContent = "REGLAS LOCALES";
}
async function localRequest(path, body, token = state.token, timeout = 150000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const r = await fetch(`http://127.0.0.1:4318${path}`, {
      method: body ? "POST" : "GET",
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      cache: "no-store",
      credentials: "omit",
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "El motor no pudo completar el análisis.");
    return data;
  } finally {
    clearTimeout(timer);
  }
}
async function analyze() {
  if (state.busy) return;
  state.busy = true;
  $("#message").disabled = true;
  $("#capture").disabled = true;
  $("#analyze").disabled = true;
  $("#analyze").textContent = "Revisando…";
  $("#form-status").textContent = "";
  state.last = null;
  $("#result").innerHTML =
    '<div class="empty-result"><span class="empty-symbol" aria-hidden="true">◎</span><h3>Revisando las señales…</h3><p>El contenido permanece en tu equipo.</p></div>';
  try {
    let result;
    if (state.mode === "text") {
      const local = analyzeText($("#message").value);
      if (state.connected) {
        $("#form-status").textContent = "QVAC está preparando la explicación local. La primera carga puede tardar.";
        result = await localRequest("/analyze-text", { text: $("#message").value });
      } else result = local;
    } else {
      if (!state.connected)
        throw new Error("Conecta el motor QVAC local para leer capturas, o usa la pestaña Texto del mensaje.");
      const file = $("#capture").files[0];
      if (!file) throw new Error("Selecciona primero una captura PNG o JPG.");
      if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 5 * 1024 * 1024)
        throw new Error("Usa una imagen PNG o JPG de hasta 5 MB.");
      const image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
        reader.readAsDataURL(file);
      });
      $("#form-status").textContent =
        "VisionPsy y Qwen3 están procesando la captura en tu equipo. La primera carga puede tardar.";
      result = await localRequest("/analyze-image", { image });
    }
    renderResult(result);
    $("#form-status").textContent = "";
    return result;
  } catch (error) {
    $("#result").innerHTML =
      '<div class="empty-result"><h3>No pudimos completar el análisis.</h3><p>Revisa la indicación junto al botón e inténtalo de nuevo.</p></div>';
    $("#form-status").textContent =
      error instanceof TypeError || error.name === "AbortError"
        ? "No se pudo contactar con QVAC. Revisa el puente y el permiso de red local. Puedes desconectarlo para analizar texto con reglas."
        : error.message;
    throw error;
  } finally {
    state.busy = false;
    $("#message").disabled = false;
    $("#capture").disabled = false;
    $("#analyze").disabled = false;
    $("#analyze").textContent = state.mode === "image" ? "Analizar captura con QVAC ↗" : "Analizar mensaje ↗";
  }
}
$("#analyze-form").addEventListener("submit", (event) => {
  event.preventDefault();
  void analyze().catch(() => {});
});
$("#message").addEventListener("input", () => {
  $("#counter").textContent = `${$("#message").value.length} / 5000`;
  if (!state.busy) resetResult();
});
$("#clear").addEventListener("click", () => {
  if (state.busy) return;
  $("#message").value = "";
  $("#capture").value = "";
  $("#file-label").textContent = "Necesitas conectar tu motor QVAC local.";
  $("#counter").textContent = "0 / 5000";
  resetResult();
  $("#message").focus();
});
document
  .querySelectorAll("[data-mode]")
  .forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
$("#capture").addEventListener("change", () => {
  if (!state.busy) resetResult();
  $("#file-label").textContent = $("#capture").files[0]?.name || "Selecciona una captura.";
});
$("#disconnect").addEventListener("click", () => {
  if (state.busy) return;
  disconnect();
  $("#connection-status").textContent = "Desconectado. El análisis por texto usa reglas en este navegador.";
  resetResult();
});
$("#connect-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (state.busy) return;
  const token = $("#pair-token").value.trim();
  const button = event.currentTarget.querySelector("button");
  button.disabled = true;
  $("#connection-status").textContent = "Comprobando el puente local y la disponibilidad del SDK…";
  try {
    const health = await localRequest("/health", null, token, 8000);
    if (!health.sdkAvailable) throw new Error("El puente responde, pero falta instalar @qvac/sdk en el proyecto.");
    state.token = token;
    state.connected = true;
    $("#connection-badge").textContent = "Puente conectado";
    $("#disconnect").hidden = false;
    $("#connection-status").textContent =
      "Puente conectado. Los modelos se cargarán al analizar; cualquier error se mostrará aquí. Cierra otras apps QVAC antes de usarlo.";
    resetResult();
  } catch (error) {
    disconnect();
    $("#connection-status").textContent =
      error instanceof TypeError || error.name === "AbortError"
        ? "No se pudo conectar. Inicia el puente en este equipo, comprueba la clave y permite el acceso a la red local."
        : error.message;
  } finally {
    button.disabled = false;
  }
});
const lifecycle = new AbortController();
if (document.modelContext?.registerTool) {
  try {
    Promise.resolve(
      document.modelContext.registerTool(
        {
          name: "certiva_analyze_message",
          title: "Analizar mensaje con Certiva",
          description:
            "Analiza texto con reglas locales y actualiza el resultado visible. No lo transmite al banco ni activa QVAC.",
          inputSchema: {
            type: "object",
            properties: { text: { type: "string", minLength: 12, maxLength: 5000 } },
            required: ["text"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: true },
          execute(input) {
            if (state.busy) throw new Error("Ya hay un análisis en curso.");
            const result = analyzeText(input?.text);
            setMode("text");
            $("#custom-message").open = true;
            $("#message").value = input.text;
            $("#counter").textContent = `${input.text.length} / 5000`;
            renderResult(result);
            return { verdict: result.verdict, signals: result.signals, engine: result.engine };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => {});
  } catch {}
}
addEventListener("pagehide", () => {
  lifecycle.abort();
  state.token = "";
});
// A pairing key in the fragment stays on this device; it is never part of the HTTP URL.
// Only an explicit local pairing link triggers a connection attempt.
function pairFromLink() {
  const pairing = new URLSearchParams(location.hash.slice(1)).get("qvac");
  if (!pairing || !/^[a-f0-9]{64}$/.test(pairing)) return;
  history.replaceState(null, "", location.pathname + location.search + "#verificar");
  if (state.busy) return;
  $(".connection").open = true;
  $("#pair-token").value = pairing;
  $("#connect-form").requestSubmit();
}
addEventListener("hashchange", pairFromLink);
pairFromLink();

const demoCases = {
  phishing: {
    sender: "Un SMS que dice ser del banco",
    question: "Te piden actuar hoy y abrir un enlace. ¿El dominio pertenece realmente al banco?",
  },
  code: {
    sender: "Un contacto que dice ser de seguridad",
    question: "Dice que quiere ayudarte, pero te pide un código de verificación. ¿Qué revela esa solicitud?",
  },
  notice: {
    sender: "Un aviso para revisar tu estado de cuenta",
    question: "No pide claves ni incluye un enlace. ¿Qué significa que no aparezcan señales de alerta?",
  },
};
let demoCase = "phishing";
function selectDemo(key) {
  if (state.busy) return;
  demoCase = key;
  document
    .querySelectorAll("[data-demo]")
    .forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.demo === key)));
  $("#demo-sender").textContent = demoCases[key].sender;
  $("#demo-message").textContent = EXAMPLES[key];
  $("#demo-question").textContent = demoCases[key].question;
  $("#custom-message").open = false;
  resetResult();
  $("#demo-reveal").textContent = "Ver las señales ↗";
  $("#engine-label").textContent = "DEMO · REGLAS";
}
document.querySelectorAll("[data-demo]").forEach((b) => b.addEventListener("click", () => selectDemo(b.dataset.demo)));
$("#demo-reveal").addEventListener("click", () => {
  if (state.busy) return;
  renderResult(analyzeText(EXAMPLES[demoCase]));
  $("#engine-label").textContent = "DEMO · REGLAS";
  $("#demo-reveal").textContent = "Volver a ver las señales ↗";
  if (matchMedia("(max-width: 760px)").matches)
    $("#result").scrollIntoView({
      block: "start",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
});
selectDemo(demoCase);
let guideStep = 0;
const guideTabs = [...document.querySelectorAll("[data-guide-step]")];
function showGuideStep(index, focusTab = false) {
  guideStep = index;
  guideTabs.forEach((tab, i) => {
    tab.setAttribute("aria-selected", String(i === index));
    tab.tabIndex = i === index ? 0 : -1;
    document.getElementById(tab.getAttribute("aria-controls")).hidden = i !== index;
  });
  $("#guide-progress").textContent = `Paso ${index + 1} de 5`;
  $("#guide-back").disabled = index === 0;
  $("#guide-next").textContent = index === 4 ? "Volver al paso 1 ↺" : "Siguiente paso →";
  if (focusTab) guideTabs[index].focus();
}
guideTabs.forEach((tab, i) => {
  tab.addEventListener("click", () => showGuideStep(i));
  tab.addEventListener("keydown", (event) => {
    let next;
    if (event.key === "ArrowRight") next = (i + 1) % 5;
    else if (event.key === "ArrowLeft") next = (i + 4) % 5;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 4;
    else return;
    event.preventDefault();
    showGuideStep(next, true);
  });
});
$("#guide-back").addEventListener("click", () => showGuideStep(Math.max(0, guideStep - 1), true));
$("#guide-next").addEventListener("click", () => showGuideStep((guideStep + 1) % 5, true));
$("#copy-guide-example").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("#guide-sample-text").textContent);
    $("#guide-copy-status").textContent = "Ejemplo copiado. Pégalo en Certiva.";
  } catch {
    const range = document.createRange();
    range.selectNodeContents($("#guide-sample-text"));
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    $("#guide-copy-status").textContent = "Seleccionamos el ejemplo. Mantén pulsado o usa Copiar en tu dispositivo.";
  }
});
