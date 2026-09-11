const $ = (id) => document.getElementById(id);
let user = null,
  policy = null,
  assessment = null,
  cases = [],
  selected = null;
const states = { nuevo: "Nuevo", en_revision: "En revisión", resuelto: "Resuelto" };
const resolutions = {
  fraude_confirmado: "Fraude confirmado por el analista",
  legitimo: "Mensaje legítimo",
  sin_evidencia: "Sin evidencia suficiente",
};
const date = (value) => new Date(value).toLocaleString("es-PA", { dateStyle: "short", timeStyle: "short" });
function node(tag, text, className) {
  const el = document.createElement(tag);
  if (text) el.textContent = text;
  if (className) el.className = className;
  return el;
}
function notice(message) {
  $("notice").textContent = message;
  $("notice").hidden = false;
}
async function api(url, method = "GET", data) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", "X-CSRF-Token": user?.csrf || "" },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401 && user) reset();
    throw new Error(result.error);
  }
  return result;
}
function reset() {
  user = null;
  assessment = null;
  cases = [];
  selected = null;
  $("message").value = "";
  $("password").value = "";
  $("result").replaceChildren(
    node("h2", "Verifica con calma."),
    node("p", "El contenido se analiza en este dispositivo."),
  );
  $("case-list").replaceChildren();
  $("audit-list").replaceChildren();
  $("case-detail").replaceChildren();
  $("workspace").hidden = true;
  $("logout").hidden = true;
  $("login-view").hidden = false;
}
async function loadPolicy() {
  const envelope = await (await fetch("/policy.json")).json();
  const bytes = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", bytes(CERTIVA_POLICY_KEY), "Ed25519", false, ["verify"]);
  if (!(await crypto.subtle.verify("Ed25519", key, bytes(envelope.signature), bytes(envelope.payload))))
    throw new Error("No se pudo verificar la configuración");
  policy = JSON.parse(new TextDecoder().decode(bytes(envelope.payload)));
  Certiva.validatePolicy(policy);
}
function workspace() {
  $("login-view").hidden = true;
  $("workspace").hidden = false;
  $("logout").hidden = false;
  $("identity").textContent = user.id;
  $("role-label").textContent = user.role === "cliente" ? "ESPACIO DEL CLIENTE" : "EQUIPO DE PROTECCIÓN";
  $("workspace-title").textContent =
    user.role === "cliente" ? "Tu tranquilidad empieza aquí." : "Cada reporte, una acción.";
  $("workspace-description").textContent =
    user.role === "cliente"
      ? "Verifica, entiende y consulta al banco antes de actuar."
      : "Revisa los casos recibidos y deja constancia de cada decisión.";
  document.querySelector('[data-view="verify"]').hidden = user.role !== "cliente";
  document.querySelector('[data-view="audit"]').hidden = user.role === "cliente";
  view(user.role === "cliente" ? "verify" : "cases").catch((error) => notice(error.message));
}
async function view(name) {
  for (const section of ["verify", "cases", "audit"]) $(section + "-view").hidden = section !== name;
  for (const button of document.querySelectorAll("[data-view]"))
    button.classList.toggle("active", button.dataset.view === name);
  if (name === "cases") await refreshCases();
  if (name === "audit") await refreshAudit();
}
function showResult() {
  const panel = $("result");
  panel.className = `card result ${assessment.outcome}`;
  panel.replaceChildren(
    node("span", "RESULTADO DEL ANÁLISIS", "eyebrow"),
    node("h2", assessment.title),
    node("p", assessment.action),
  );
  const reasons = node("ul");
  for (const reason of assessment.reasons) reasons.append(node("li", reason.title));
  panel.append(reasons);
  panel.append(
    node("p", "Cobertura: reglas de texto · Configuración de referencia · Sin autenticación del remitente", "small"),
  );
  panel.append(
    node("h3", "Enviar un reporte"),
    node(
      "p",
      "Se enviarán el canal, los motivos, el resultado y las versiones del análisis. No se envían texto, números, enlaces ni imágenes.",
      "small",
    ),
  );
  const label = node("label", "", "consent");
  const consent = node("input");
  consent.type = "checkbox";
  consent.id = "consent";
  label.append(consent, node("span", "Quiero enviar estos datos para que el equipo revise el caso."));
  panel.append(label);
  const report = node("button", "Enviar reporte", "primary");
  report.id = "report";
  report.disabled = true;
  consent.addEventListener("change", () => (report.disabled = !consent.checked));
  report.addEventListener("click", async () => {
    report.disabled = true;
    try {
      const result = await api("/api/cases", "POST", Certiva.makeReport(assessment));
      consent.disabled = true;
      report.textContent = "Reporte recibido";
      panel.append(node("p", `Caso ${result.id.slice(0, 8)} · Puedes consultar su estado en Reportes.`, "small"));
    } catch (error) {
      notice(error.message);
      report.disabled = !consent.checked;
    }
  });
  panel.append(report);
}
function invalidate() {
  assessment = null;
  $("result").className = "card result";
  $("result").replaceChildren(
    node("h2", "Contenido actualizado"),
    node("p", "Verifica nuevamente para obtener un resultado de este mensaje."),
  );
}
async function refreshCases() {
  cases = (await api("/api/cases")).cases;
  renderCases();
  if (selected) detail(selected);
}
function renderCases() {
  $("metrics").replaceChildren();
  for (const [state, label] of Object.entries(states)) {
    const card = node("div", "", "metric");
    card.append(node("span", label), node("strong", String(cases.filter((c) => c.state === state).length)));
    $("metrics").append(card);
  }
  const filter = $("filter").value;
  const visible = cases.filter((c) => filter === "todos" || c.state === filter);
  $("case-list").replaceChildren();
  if (!visible.length)
    $("case-list").append(node("p", "No hay reportes en este estado. Los nuevos casos aparecerán aquí.", "empty"));
  for (const item of visible) {
    const button = node("button", "", `case-row${selected === item.id ? " selected" : ""}`);
    button.append(
      node("span", states[item.state], "state"),
      node("strong", Certiva.LABELS[item.report.outcome]),
      node("small", `${item.report.channel} · ${date(item.created)} · ${item.id.slice(0, 8)}`),
    );
    button.addEventListener("click", () => {
      selected = item.id;
      renderCases();
      detail(item.id);
    });
    $("case-list").append(button);
  }
}
function detail(id) {
  const item = cases.find((c) => c.id === id);
  if (!item) return;
  const panel = $("case-detail");
  panel.replaceChildren(
    node("span", `CASO ${id.slice(0, 8)}`, "eyebrow"),
    node("h2", Certiva.LABELS[item.report.outcome]),
    node("p", states[item.state]),
  );
  const reasons = node("ul");
  item.report.reasonCodes.forEach((code) => {
    reasons.append(node("li", Certiva.REASONS[code]));
  });
  panel.append(reasons);
  panel.append(
    node(
      "p",
      "Motivos aportados por el cliente; la conclusión del analista se registra por separado. No contiene el mensaje original.",
      "small",
    ),
    node("p", `${item.report.policyVersion} · SDK ${item.report.sdkVersion} · ${item.report.source}`, "small"),
  );
  if (item.assignee) panel.append(node("p", `Responsable: ${item.assignee}`));
  if (item.resolution) panel.append(node("p", resolutions[item.resolution]));
  if (user.role !== "analista" || item.state === "resuelto") return;
  const update = async (action, resolution) => {
    try {
      await api(`/api/cases/${id}`, "PATCH", { version: item.version, action, ...(resolution ? { resolution } : {}) });
      await refreshCases();
      notice("Caso actualizado");
    } catch (error) {
      notice(error.message);
      await refreshCases();
    }
  };
  if (item.state === "nuevo") {
    const button = node("button", "Tomar caso", "primary");
    button.addEventListener("click", () => update("tomar"));
    panel.append(button);
  }
  if (item.state === "en_revision" && item.assignee === user.id) {
    const label = node("label", "Conclusión de la revisión");
    label.htmlFor = "resolution";
    const select = node("select");
    select.id = "resolution";
    select.append(new Option("Selecciona una conclusión", ""));
    for (const [value, text] of Object.entries(resolutions)) select.append(new Option(text, value));
    const button = node("button", "Resolver caso", "primary");
    button.disabled = true;
    select.addEventListener("change", () => (button.disabled = !select.value));
    button.addEventListener("click", () => update("resolver", select.value));
    panel.append(label, select, button);
  }
}
async function refreshAudit() {
  const { events } = await api("/api/audit");
  $("audit-list").replaceChildren();
  for (const event of events) {
    const row = node("div", "", "audit-row");
    const body = node("div", event.event.replaceAll("_", " "));
    body.append(node("small", `${event.actor}${event.case_id ? ` · Caso ${event.case_id.slice(0, 8)}` : ""}`));
    row.append(node("span", date(event.created)), body);
    $("audit-list").append(row);
  }
}
$("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  try {
    user = await api("/api/login", "POST", { username: $("username").value, password: $("password").value });
    $("password").value = "";
    $("notice").hidden = true;
    workspace();
  } catch (error) {
    notice(error.message);
  } finally {
    button.disabled = false;
  }
});
$("logout").addEventListener("click", async () => {
  try {
    await api("/api/logout", "POST");
    reset();
  } catch (error) {
    notice(error.message);
  }
});
$("verify-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    if (!policy) throw new Error("La configuración aún no está disponible");
    assessment = Certiva.assess(
      { id: crypto.randomUUID(), text: $("message").value, channel: $("channel").value, source: "texto" },
      policy,
    );
    showResult();
  } catch (error) {
    notice(error.message);
  }
});
$("message").addEventListener("input", invalidate);
$("channel").addEventListener("change", invalidate);
for (const button of document.querySelectorAll("[data-example]"))
  button.addEventListener("click", () => {
    $("message").value =
      button.dataset.example === "risk"
        ? "Caja de Ahorros: su cuenta será bloqueada hoy. Envíe el código de verificación en https://cajadeahorros-seguridad.example para desbloquearla."
        : "Tu estado de cuenta está disponible. Consulta desde la aplicación del banco. Nunca compartas claves ni códigos.";
    invalidate();
  });
for (const button of document.querySelectorAll("[data-view]"))
  button.addEventListener("click", () => view(button.dataset.view).catch((error) => notice(error.message)));
$("filter").addEventListener("change", renderCases);
$("refresh").addEventListener("click", () => refreshCases().catch((error) => notice(error.message)));
$("refresh-audit").addEventListener("click", () => refreshAudit().catch((error) => notice(error.message)));
loadPolicy().catch((error) => {
  $("analyze").disabled = true;
  notice(error.message);
});
api("/api/session")
  .then((result) => {
    user = result;
    workspace();
  })
  .catch(() => {});
