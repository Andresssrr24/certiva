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
        ? "Tu cuenta está lista para participar."
        : data.enabled
          ? "Confirma tu cuenta para activar el acceso."
          : "Prueba disponible por invitación.");
    $("beta-invitation").hidden = data.enabled;
    $("beta-form").hidden = !data.enabled || data.registered;
    $("beta-success").hidden = !data.registered;
    if (data.registered) {
      const url = new URL(data.playUrl);
      if (url.origin !== "https://play.google.com" || url.pathname !== "/apps/testing/local.certiva.pilot")
        throw new Error();
      $("registered-email").textContent = data.email;
      $("play-link").href = url.href;
    }
  } catch {
    $("beta-status").textContent =
      "No pudimos comprobar el registro automático. Si ya tienes acceso, puedes abrir la prueba interna.";
    $("beta-invitation").hidden = false;
    $("beta-form").hidden = true;
    $("beta-success").hidden = true;
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
load();
