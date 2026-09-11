"use strict";
// Demo OS notifications are scoped to the simulated phone. Android uses a native listener.
let incomingMessage = null;
let pendingAssessment = null;
let experienceBusy = false;
let phoneMode = "escritorio";
function experienceStatus(title, description, busy = false) {
  $("#experienceStatus").classList.toggle("busy", busy);
  $("#experienceStatus b").textContent = title;
  $("#experienceStatus small").textContent = description;
}
function journeyStep(name) {
  const order = ["received", "analysis", "alert"];
  for (const li of document.querySelectorAll("#journey li"))
    li.classList.toggle("active", order.indexOf(li.dataset.step) <= order.indexOf(name));
}
function phoneDesktop() {
  phoneMode = "escritorio";
  pantalla("escritorio");
  $("#tCuelga").hidden = true;
}
function openIncoming() {
  if (!incomingMessage) {
    experienceStatus("El teléfono está en reposo.", "Elige una situación para recibir un mensaje de prueba.");
    return;
  }
  const m = incomingMessage;
  phoneMode = "mensaje";
  $("#sourceNotification").hidden = true;
  $("#sourceSender").textContent = m.remitente || "Mensaje entrante";
  $("#sourceChannel").textContent =
    m.canal === "whatsapp"
      ? "WhatsApp · remitente del ejemplo"
      : m.canal === "correo"
        ? "Correo entrante"
        : "Mensaje de texto";
  $("#sourceText").textContent = m.texto;
  $("#sourceTime").textContent = m.hora || "ahora";
  $("#sourceIcon").textContent = m.canal === "correo" ? "✉" : "◔";
  $("#sourceContext").textContent = "Mensaje de ejemplo. El nombre visible no confirma la identidad del remitente.";
  $('[data-p="mensaje"]').classList.toggle("email", m.canal === "correo");
  pantalla("mensaje");
}
function openAssessment() {
  if (!pendingAssessment) {
    pantalla("inicio");
    return;
  }
  $("#certivaNotification").hidden = true;
  $("#sourceNotification").hidden = true;
  $("#appBadge").hidden = true;
  phoneMode = "certiva";
  pintaTelefono(pendingAssessment);
  experienceStatus("Ahora estás dentro de Certiva.", "Revisa las señales y decide si quieres reportar el mensaje.");
}
function assessmentArrived(r) {
  pendingAssessment = r;
  const type = r.ok ? r.veredicto?.veredicto || r.veredicto_reglas : "no_legible";
  const risk = ["fraude", "sospechoso"].includes(type);
  $("#pushTitle").textContent = risk
    ? "Antes de responder, revisa esto."
    : type === "sin_senales"
      ? "Mensaje revisado"
      : "No pudimos verificar el mensaje";
  $("#pushBody").textContent = risk
    ? "Hay señales de riesgo en el mensaje recibido. Toca para ver cómo protegerte."
    : type === "sin_senales"
      ? "No se encontraron señales. Esto no confirma autenticidad. Toca para ver el detalle."
      : "Toca para revisar la lectura e intentarlo de nuevo.";
  $("#certivaNotification").classList.toggle("risk", risk);
  $("#certivaNotification").hidden = false;
  $("#appBadge").hidden = false;
  journeyStep("alert");
  experienceStatus(
    risk ? "Certiva encontró señales y te avisó." : "La revisión terminó.",
    "Toca la notificación de Certiva en el teléfono para abrir el detalle.",
  );
}
async function receiveScenario(example, button) {
  if (ocupado || experienceBusy || !mensajesDisponibles) return;
  experienceBusy = true;
  window.certivaScenarioBusy = true;
  actualizarAcciones();
  pendingAssessment = null;
  incomingMessage = example.mensaje || {
    canal: "sms",
    remitente: "Mensaje de ejemplo",
    texto: "Abre la captura para revisar el mensaje.",
  };
  phoneDesktop();
  $("#certivaNotification").hidden = true;
  $("#appBadge").hidden = true;
  $("#sourceNotification").hidden = false;
  const m = incomingMessage;
  $("#arrivalApp").textContent = m.canal === "whatsapp" ? "WHATSAPP" : m.canal === "correo" ? "CORREO" : "MENSAJES";
  $("#arrivalSender").textContent = m.remitente;
  $("#arrivalPreview").textContent = m.texto;
  $("#arrivalIcon").textContent = m.canal === "correo" ? "✉" : m.canal === "whatsapp" ? "◔" : "☰";
  for (const b of document.querySelectorAll(".ejemplo")) b.classList.toggle("selected", b === button);
  journeyStep("received");
  experienceStatus(
    "Acaba de llegar un mensaje.",
    "Puedes abrirlo; Certiva hará la revisión sin entrar a su app.",
    true,
  );
  try {
    await new Promise((resolve) => setTimeout(resolve, 900));
    journeyStep("analysis");
    experienceStatus(
      "Certiva está revisando el contenido.",
      "La inferencia ocurre en este equipo. El teléfono sigue fuera de Certiva.",
      true,
    );
    await analizar(example.ruta, { background: true });
  } finally {
    experienceBusy = false;
    window.certivaScenarioBusy = false;
    actualizarAcciones();
  }
}
$("#sourceNotification").onclick = openIncoming;
$("#certivaNotification").onclick = openAssessment;
$("#openCertiva").onclick = openAssessment;
$("#phoneHome").onclick = phoneDesktop;
$("#tVolver").onclick = phoneDesktop;
$("#tVolver2").onclick = phoneDesktop;
for (const b of document.querySelectorAll("[data-home-app]")) b.onclick = openIncoming;

let bankCases = [];
let selectedCaseId = null;
const caseStateLabel = { new: "Nuevo", review: "En revisión", resolved: "Resuelto", dismissed: "Descartado" };
const caseActionLabel = {
  assign: "Tomar caso",
  contact: "Solicitar verificación",
  reset: "Solicitar cambio de clave",
  revoke: "Solicitar cierre de sesiones",
  resolve: "Resolver revisión",
  dismiss: "Descartar caso",
};
function isCaseClosed(c) {
  return ["resolved", "dismissed"].includes(c.state);
}
function renderCases() {
  const closed = bankCases.filter(isCaseClosed).length;
  const measures = bankCases.reduce((n, c) => n + c.actions.filter((a) => ["reset", "revoke"].includes(a)).length, 0);
  $("#caseKpis").innerHTML = [
    [bankCases.length - closed, "Incidentes abiertos"],
    [bankCases.filter((c) => c.risk === "Alta" && !isCaseClosed(c)).length, "Prioridad alta"],
    [measures, "Medidas solicitadas"],
    [closed, "Revisiones cerradas"],
  ]
    .map(([n, label]) => `<div><b>${n}</b><span>${label}</span></div>`)
    .join("");
  const filter = $("#caseFilter").value;
  const visible = bankCases.filter(
    (c) => filter === "all" || (filter === "resolved" ? isCaseClosed(c) : !isCaseClosed(c)),
  );
  if (!visible.some((c) => c.id === selectedCaseId)) selectedCaseId = visible[0]?.id || null;
  $("#caseList").innerHTML =
    visible
      .map(
        (c) =>
          `<button class="case-row ${c.id === selectedCaseId ? "selected" : ""}" data-case="${esc(c.id)}"><span class="case-row-header"><span>CT-${esc(c.id.slice(0, 6).toUpperCase())}</span><span class="severity ${c.risk === "Media" ? "medium" : ""}">${esc(c.risk)}</span></span><b>${esc(c.title)}</b><small>${esc(c.channel)} · ${caseStateLabel[c.state]}</small><small>${c.source === "simulacion" ? "Evento sintético" : "Reportado desde este equipo"} · ${new Date(c.createdAt).toLocaleTimeString("es-PA", { hour: "2-digit", minute: "2-digit" })}</small></button>`,
      )
      .join("") ||
    '<div class="case-empty">No hay incidentes en esta vista.<br>Genera un evento de prueba o reporta un mensaje desde el teléfono.</div>';
  for (const b of document.querySelectorAll("[data-case]"))
    b.onclick = () => {
      selectedCaseId = b.dataset.case;
      renderCases();
    };
  const c = bankCases.find((c) => c.id === selectedCaseId);
  if (!c) {
    $("#caseDetail").innerHTML =
      '<div class="case-empty">◉<h2>Listo para investigar.</h2>Selecciona un incidente para ver el contexto, las acciones disponibles y su historial.</div>';
    return;
  }
  const actions = isCaseClosed(c) ? [] : !c.owner ? ["assign"] : ["contact", "reset", "revoke", "resolve", "dismiss"];
  $("#caseDetail").innerHTML =
    `<span class="eyebrow">CT-${esc(c.id.slice(0, 6).toUpperCase())} · ${caseStateLabel[c.state]}</span><h2>${esc(c.title)}</h2><p>${esc(c.detail)}</p><div class="case-meta"><span>Responsable<b>${esc(c.owner || "Sin asignar")}</b></span><span>Origen<b>${c.source === "simulacion" ? "Simulación" : "Reporte del cliente"}</b></span></div><h3 class="rotulo">Respuesta del equipo</h3><div class="case-action-grid">${actions.map((a) => `<button data-case-action="${a}" ${c.actions.includes(a) || (a === "resolve" && !c.actions.some((x) => ["contact", "reset", "revoke"].includes(x))) ? "disabled" : ""}>${c.actions.includes(a) ? "✓ " : ""}${caseActionLabel[a]}</button>`).join("")}</div><p>${isCaseClosed(c) ? "Revisión cerrada. El historial conserva las acciones realizadas en el piloto." : "Las solicitudes quedan registradas. Este piloto no cambia claves, cierra sesiones ni contacta al cliente."}</p><h3 class="rotulo">Historial del caso</h3><ol class="case-audit">${c.audit
      .slice()
      .reverse()
      .map((a) => `<li>${esc(a.label)}<time>${new Date(a.at).toLocaleString("es-PA")}</time></li>`)
      .join("")}</ol>`;
  for (const b of document.querySelectorAll("[data-case-action]"))
    b.onclick = async () => {
      b.disabled = true;
      try {
        bankCases = await window.escudo.casoAccion(c.id, b.dataset.caseAction);
        renderCases();
      } catch (e) {
        pon(e.message || e);
        b.disabled = false;
      }
    };
}
$("#injectBankCase").onclick = async () => {
  $("#injectBankCase").disabled = true;
  try {
    bankCases = await window.escudo.casoCrear({ type: $("#bankScenario").value, source: "simulacion" });
    selectedCaseId = bankCases[0].id;
    $("#caseFilter").value = "open";
    renderCases();
  } catch (e) {
    pon(e.message || e);
  } finally {
    $("#injectBankCase").disabled = false;
  }
};
$("#caseFilter").onchange = renderCases;
async function createReportedCase(r) {
  const signals = r.veredicto?.senales?.length ? r.veredicto.senales : r.senales || [];
  const type = signals.some((s) => s.tipo === "pide_datos_sensibles")
    ? "otp"
    : signals.some((s) => ["dominio_parecido", "dominio_no_oficial"].includes(s.tipo))
      ? "phishing"
      : "review";
  bankCases = await window.escudo.casoCrear({ type, source: "reporte_cliente" });
  renderCases();
}
window.escudo
  .casos()
  .then((cases) => {
    bankCases = cases;
    renderCases();
  })
  .catch((e) => {
    $("#caseDetail").textContent = `No se pudieron cargar los casos: ${e.message || e}`;
  });
$("#openPilotConsole").onclick = async () => {
  const button = $("#openPilotConsole");
  button.disabled = true;
  try {
    await window.escudo.abrirConsolaPiloto();
  } catch (error) {
    pon(error.message || error);
    experienceStatus("Consola del piloto no disponible", "Inicia el servidor en el puerto 4320.");
  } finally {
    button.disabled = false;
  }
};
