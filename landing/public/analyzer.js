// Deterministic browser checks. These do not claim to authenticate a sender.
export const BANK = Object.freeze({
  nombre: "Caja de Ahorros",
  dominios_oficiales: ["cajadeahorros.com.pa", "www.cajadeahorros.com.pa"],
  telefonos_oficiales: ["800-2252", "508-3456", "508-1971", "508-3622"],
  remitentes_oficiales: [],
  acortadores: ["bit.ly", "tinyurl.com", "t.co", "cutt.ly", "is.gd", "rb.gy", "short.io"],
  canal_oficial: "Consulta el número impreso en tu tarjeta de Caja de Ahorros o el 800-2252.",
});
export const EXAMPLES = Object.freeze({
  phishing:
    "Caja de Ahorros: tu cuenta será bloqueada hoy. Actualiza tus datos de inmediato en https://cajadeahorros-validar.example/activar",
  code: "Hola, somos del equipo de seguridad de Caja de Ahorros. Envíame el código de verificación que acabas de recibir para cancelar una compra no reconocida.",
  notice:
    "Tu estado de cuenta ya está disponible. Revísalo ingresando directamente a la aplicación del banco. Nunca compartas tu contraseña ni tus códigos de verificación.",
});
export const normalize = (text) =>
  String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function extractDomains(text) {
  const matches =
    String(text).match(
      /(?:https?:\/\/|www\.)[^\s<>"'«»]+|\b(?:[\p{L}\d][\p{L}\d-]*\.)+[a-z]{2,}(?:\/[^\s<>"'«»]*)?/giu,
    ) || [];
  return [
    ...new Set(
      matches
        .map((raw) => {
          try {
            return new URL(/^https?:\/\//i.test(raw) ? raw : "https://" + raw).hostname
              .toLowerCase()
              .replace(/^www\./, "");
          } catch {
            return "";
          }
        })
        .filter(Boolean),
    ),
  ];
}
export function analyzeText(value) {
  if (typeof value !== "string" || value.trim().length < 12)
    throw new Error("Pega un mensaje de al menos 12 caracteres para poder revisarlo.");
  if (value.length > 5000) throw new Error("El mensaje debe tener como máximo 5000 caracteres.");
  const started = performance.now(),
    text = value.trim(),
    normalized = normalize(text),
    domains = extractDomains(text),
    signals = [];
  const add = (type, title, evidence) => {
    if (!signals.some((s) => s.type === type)) signals.push({ type, title, evidence });
  };
  const bankClaim = /caja\s*(?:de\s*)?ahorros|\bbanco\b|banca|\bcuenta\b|tarjeta/.test(normalized);
  for (const domain of domains) {
    if (
      ["cajadeahorros.com.pa", "ecaja.cajadeahorros.com.pa", "aperturadecuentaca.cajadeahorros.com.pa"].includes(domain)
    )
      continue;
    // Unknown subdomains are deliberately not authenticated by suffix matching.
    if (BANK.acortadores.includes(domain))
      add("shortener", "El enlace oculta su destino", `El acortador ${domain} no permite ver la dirección final.`);
    else if (/(?:^|\.)xn--/.test(domain) || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(domain))
      add("disguised", "La dirección requiere atención", `La dirección ${domain} usa una IP o caracteres codificados.`);
    else if (/caja|ahorros/.test(domain))
      add(
        "lookalike",
        "El enlace no coincide con el dominio verificado",
        `${domain} es distinto de cajadeahorros.com.pa. No confirma un canal del banco.`,
      );
    else if (bankClaim)
      add(
        "unknown",
        "El enlace no es un canal verificado",
        `${domain} no aparece entre los canales configurados de Caja de Ahorros.`,
      );
  }
  const clauses = normalized.split(/[.!?;\n]+/);
  for (const clause of clauses) {
    // Scope negation to each request verb so a warning cannot hide a later request.
    const requests = clause.matchAll(
      /\b(?:envia(?:me)?|envie(?:me)?|dime|digame|dame|deme|comparte|comparta|ingresa|ingrese|confirma|confirme|responde|responda|indica|indique|digita|digite|proporciona|proporcione|escribe|escriba|necesito|necesitamos|solicitamos|solicito|manda(?:me)?|pasame|dicta(?:me)?|dicte(?:me)?|leeme|leame)\b/g,
    );
    for (const request of requests) {
      const prefix = clause.slice(Math.max(0, request.index - 28), request.index);
      if (/\b(?:no|nunca|jamas)\s+(?:(?:lo|la|los|las|te|se)\s+)?$/.test(prefix)) continue;
      const following = clause.slice(request.index, request.index + 100);
      if (/\b(?:clave|contrasena|pin|codigos?|token|cvv|numero de (?:tu )?tarjeta)\b/.test(following))
        add(
          "sensitive",
          "Te piden información sensible",
          "El texto solicita una clave, un código o un dato de acceso. No lo compartas por mensajes ni llamadas.",
        );
    }
    if (
      !/\b(?:no|nunca|jamas)\b/.test(clause) &&
      /(?:codigo|clave|contrasena|token|cvv).{0,50}(?:para (?:activar|verificar|desbloquear|cancelar)|en (?:este|el) enlace)/.test(
        clause,
      )
    )
      add(
        "sensitive",
        "Te piden información sensible",
        "Relacionan un código o una clave con una acción solicitada. Verifica directamente con el banco.",
      );
  }
  if (
    /(?:cuenta|tarjeta).{0,24}(?:bloquead|suspendid)|(?:sera|quedara).{0,12}(?:bloquead|suspendid)|urgente|de inmediato|ahora mismo|ultimo aviso|vence hoy|hoy mismo|\b(?:24|48) horas\b/.test(
      normalized,
    )
  )
    add(
      "urgency",
      "Te presionan para actuar",
      "El mensaje utiliza una amenaza o un plazo corto. La urgencia es una señal para detenerse y verificar.",
    );
  if (
    /(?:transfier[ae]|deposit[ae]|pag[au]e?|envia el (?:monto|dinero)).{0,70}(?:a (?:la|esta|mi) cuenta|al numero|a nombre de|yappy|nequi)/.test(
      normalized,
    )
  )
    add(
      "payment",
      "Solicitan un pago a un destino indicado",
      "Confirma por un canal independiente antes de enviar dinero.",
    );
  const meaningful = (normalized.match(/[a-z]+/g) || []).filter((w) => w.length > 1);
  const inconclusive = meaningful.length < 3;
  const verdict = inconclusive
    ? "no_legible"
    : signals.some((s) => s.type !== "urgency")
      ? "fraude"
      : signals.length
        ? "sospechoso"
        : "sin_senales";
  return {
    verdict,
    signals,
    domains,
    engine: "browser-rules",
    elapsedMs: Math.round(performance.now() - started),
    text,
  };
}
export const PRESENTATION = {
  fraude: {
    badge: "SEÑALES DE RIESGO",
    title: "Haz una pausa. Hay señales de alerta.",
    action: "No abras los enlaces ni compartas claves o códigos. Confirma el mensaje directamente con el banco.",
  },
  sospechoso: {
    badge: "REVISA ANTES DE ACTUAR",
    title: "La urgencia merece otra mirada.",
    action:
      "Detente y verifica por el número de tu tarjeta. Una amenaza o un plazo corto no confirman por sí solos un fraude.",
  },
  sin_senales: {
    badge: "SIN SEÑALES DETECTADAS",
    title: "No encontramos señales en este texto.",
    action:
      "Esto no confirma que el mensaje sea auténtico. Si tienes dudas, consulta al banco. Nunca compartas claves ni códigos.",
  },
  no_legible: {
    badge: "RESULTADO NO CONCLUYENTE",
    title: "Necesitamos una lectura más clara.",
    action: "Revisa que el mensaje esté completo o prueba otra captura. Confirma con el banco antes de actuar.",
  },
};
