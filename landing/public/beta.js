const $ = (id) => document.getElementById(id);
const messages = {
  pendiente: "El registro automático todavía no está disponible.",
  consentimiento: "Confirma que quieres participar para continuar.",
  correo: "Escribe un correo válido de Google.",
  sesion: "La sesión venció. Vuelve a confirmar tu correo.",
  cancelado: "No se completó la confirmación con Google. Puedes intentarlo otra vez.",
  reintentar: "No pudimos completar el alta. Tu acceso no está confirmado; inténtalo de nuevo.",
};
const state = new URLSearchParams(location.search).get("estado");
async function load() {
  try {
    const response = await fetch("/api/beta/status", { cache: "no-store", credentials: "same-origin" });
    if (!response.ok) throw new Error();
    const data = await response.json();
    $("beta-status").textContent =
      messages[state] ||
      (data.registered
        ? "Tu registro está confirmado."
        : data.enabled
          ? "Confirma tu correo con Google para registrarte."
          : "Prueba disponible por invitación.");
    $("beta-invitation").hidden = data.enabled;
    $("beta-form").hidden = !data.enabled || data.registered;
    $("beta-success").hidden = !data.registered;
    $("play-link").hidden = true;
    $("play-link").removeAttribute("href");
    $("play-help").hidden = true;
    $("play-pending").hidden = !data.enabled || data.playReady === true;
    if (data.registered) {
      $("registered-email").textContent = data.email;
      if (data.playReady === true) {
        const url = new URL(data.playUrl);
        if (
          url.origin !== "https://play.google.com" ||
          url.pathname !== "/apps/testing/local.certiva.pilot" ||
          url.search ||
          url.hash
        )
          throw new Error();
        $("play-link").href = url.href;
        $("play-link").hidden = false;
        $("play-help").hidden = false;
      }
    }
  } catch {
    $("beta-status").textContent =
      "No pudimos comprobar el registro automático. Si ya tienes acceso, puedes abrir la prueba interna.";
    $("beta-invitation").hidden = false;
    $("beta-form").hidden = true;
    $("beta-success").hidden = true;
    $("play-pending").hidden = true;
  }
}
$("use-another-email").addEventListener("click", () => {
  $("beta-success").hidden = true;
  $("beta-form").hidden = false;
  $("beta-email").focus();
});
$("beta-form").addEventListener("submit", () => {
  const button = $("beta-form").querySelector("button");
  button.disabled = true;
  button.textContent = "Abriendo Google…";
});
window.addEventListener("pageshow", () => {
  const button = $("beta-form").querySelector("button");
  button.disabled = false;
  button.textContent = "Confirmar con Google ↗";
});
load();
