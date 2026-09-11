import { analyzeText, EXAMPLES, PRESENTATION } from "./analyzer.js";

const channels = Object.freeze({
  phishing: { app: "Mensajes", icon: "messages", sender: "Remitente desconocido" },
  code: { app: "WhatsApp", icon: "whatsapp", sender: "Supuesto equipo de seguridad" },
  notice: { app: "Correo", icon: "mail", sender: "Aviso de estado de cuenta" },
});

export function phoneScenario(key) {
  if (!Object.hasOwn(channels, key)) throw new Error("Ejemplo desconocido.");
  const result = analyzeText(EXAMPLES[key]);
  const risk = ["fraude", "sospechoso"].includes(result.verdict);
  return {
    ...channels[key],
    text: EXAMPLES[key],
    result,
    presentation: PRESENTATION[result.verdict],
    risk,
    alertTitle: risk ? "No respondas todavía." : "Mensaje revisado.",
    alertBody: risk
      ? "Detectamos señales de riesgo. Toca para verlas."
      : "No encontramos señales. Esto no confirma autenticidad.",
  };
}

export function initAndroidDemo(root = document) {
  const $ = (selector) => root.querySelector(selector);
  const all = (selector) => root.querySelectorAll(selector);
  let scenario;
  let selected = "phishing";

  function show(view, focus = true) {
    for (const name of ["home", "message", "detail"]) $(`#android-${name}`).hidden = name !== view;
    $("#android-screen").dataset.view = view;
    $("#android-instruction").textContent =
      view === "home"
        ? "Toca la notificación de Certiva para ver las señales."
        : view === "message"
          ? "Estás viendo el mensaje. Abre la revisión de Certiva para conocer las señales."
          : "Estás dentro de Certiva. Lee las señales y el siguiente paso.";
    if (focus) {
      const target =
        view === "home"
          ? $("#android-alert")
          : view === "detail"
            ? $("#android-result-title")
            : $("#android-message [data-phone-home]");
      target.focus({ preventScroll: true });
    }
  }

  function select(key) {
    selected = key;
    scenario = phoneScenario(key);
    for (const button of all("[data-demo]")) button.setAttribute("aria-pressed", String(button.dataset.demo === key));
    $("#android-channel").textContent = scenario.app;
    $("#android-notification-icon").setAttribute("href", `#android-${scenario.icon}`);
    $("#android-sender").textContent = scenario.sender;
    $("#android-preview").textContent = scenario.text;
    $("#android-alert-title").textContent = scenario.alertTitle;
    $("#android-alert-body").textContent = scenario.alertBody;
    $("#android-conversation-title").textContent = scenario.app;
    $("#android-message-text").textContent = scenario.text;
    $("#android-result-badge").textContent = scenario.presentation.badge;
    $("#android-result-badge").classList.toggle("neutral", !scenario.risk);
    $("#android-result-title").textContent = scenario.presentation.title;
    $("#android-result-action").textContent = scenario.presentation.action;
    $("#android-next-text").textContent = scenario.risk
      ? "No respondas ni abras el enlace. Consulta al banco por el número de tu tarjeta o su canal oficial."
      : "Entra a la aplicación del banco por tu cuenta. No compartas contraseñas ni códigos.";
    const signals = $("#android-signals");
    signals.replaceChildren();
    for (const signal of scenario.result.signals) {
      const item = root.createElement("li");
      const title = root.createElement("strong");
      const evidence = root.createElement("span");
      title.textContent = signal.title;
      evidence.textContent = signal.evidence;
      item.append(title, evidence);
      signals.append(item);
    }
    signals.hidden = !scenario.result.signals.length;
    show("home", false);
  }

  all("[data-demo]").forEach((button) => {
    button.addEventListener("click", () => select(button.dataset.demo));
  });
  all("[data-phone-home]").forEach((button) => {
    button.addEventListener("click", () => show("home"));
  });
  all("[data-phone-app]").forEach((button) => {
    button.addEventListener("click", () => {
      select(button.dataset.phoneApp);
      show("message");
    });
  });
  $("#android-alert").addEventListener("click", () => show("detail"));
  $("#android-app-certiva").addEventListener("click", () => show("detail"));
  $("#android-message-open").addEventListener("click", () => show("message"));
  $("#android-message-result").addEventListener("click", () => show("detail"));
  $("#android-view-message").addEventListener("click", () => show("message"));
  $("#android-replay").addEventListener("click", () => {
    select(selected);
    show("home");
  });
  $("#android-screen").addEventListener("keydown", (event) => {
    if (event.key === "Escape" && $("#android-screen").dataset.view !== "home") {
      event.preventDefault();
      show("home");
    }
  });
  select(selected);
}
