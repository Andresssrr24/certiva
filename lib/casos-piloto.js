"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const EVENTS = Object.freeze({
  review: {
    title: "Mensaje reportado para revisión",
    risk: "Media",
    channel: "Mensaje",
    detail:
      "El cliente solicita una revisión del mensaje. El reporte por sí solo no confirma fraude ni robo de credenciales.",
  },
  phishing: {
    title: "Posible robo de credenciales",
    risk: "Alta",
    channel: "Mensaje",
    detail:
      "El contenido contiene señales de suplantación o un enlace que requiere revisión. Confirmar el incidente por un canal de confianza.",
  },
  otp: {
    title: "Solicitud de un código privado",
    risk: "Alta",
    channel: "WhatsApp / SMS",
    detail:
      "Se identificó una solicitud de clave o código. Revisar con el cliente si compartió información antes de solicitar medidas sobre sus accesos.",
  },
  login: {
    title: "Acceso desde un dispositivo nuevo",
    risk: "Media",
    channel: "Acceso bancario · simulado",
    detail:
      "Evento sintético: el cliente inicia sesión desde un dispositivo no reconocido. Validar identidad antes de intervenir.",
  },
  attempts: {
    title: "Intentos de acceso repetidos",
    risk: "Alta",
    channel: "Autenticación · simulada",
    detail:
      "Evento sintético: varios intentos fallidos de ingreso. Investigar un posible ataque a credenciales y solicitar revisión de sesiones.",
  },
});
const ACTIONS = Object.freeze({
  assign: "Asignado al analista local",
  contact: "Verificación con el cliente solicitada",
  reset: "Cambio de clave solicitado (sin ejecutar en el banco)",
  revoke: "Revocación de sesiones solicitada (sin ejecutar en el banco)",
  resolve: "Revisión del caso resuelta",
  dismiss: "Descartado por el analista",
});
class PilotCases {
  constructor(file) {
    this.file = file;
    this.cases = [];
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      if (!Array.isArray(data)) throw new Error("Registro de casos inválido");
      this.cases = data;
    }
  }
  list() {
    return structuredClone(this.cases);
  }
  save(next) {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(`${this.file}.tmp`, JSON.stringify(next, null, 2), { mode: 0o600 });
    fs.renameSync(`${this.file}.tmp`, this.file);
    this.cases = next;
  }
  create(input) {
    if (!input || !Object.hasOwn(EVENTS, input.type) || !["simulacion", "reporte_cliente"].includes(input.source))
      throw new Error("Tipo de caso inválido");
    if (Object.keys(input).some((k) => !["type", "source"].includes(k)))
      throw new Error("El caso no admite texto ni datos del cliente");
    if (input.source === "reporte_cliente" && !["phishing", "otp", "review"].includes(input.type))
      throw new Error("Evento bancario requiere simulación explícita");
    if (this.cases.length >= 1000) throw new Error("Límite de 1.000 casos del piloto alcanzado");
    const now = Date.now();
    const c = {
      id: randomUUID(),
      ...EVENTS[input.type],
      type: input.type,
      source: input.source,
      state: "new",
      owner: null,
      createdAt: now,
      actions: [],
      audit: [
        { at: now, label: input.source === "simulacion" ? "Caso sintético generado" : "Reporte recibido del cliente" },
      ],
    };
    this.save([c, ...this.cases]);
    return this.list();
  }
  act(id, action) {
    if (!Object.hasOwn(ACTIONS, action)) throw new Error("Acción no admitida");
    const next = this.list(),
      c = next.find((c) => c.id === id);
    if (!c) throw new Error("Caso no encontrado");
    if (["resolved", "dismissed"].includes(c.state)) throw new Error("El caso ya está cerrado");
    if (c.actions.includes(action)) throw new Error("La acción ya está registrada");
    if (action !== "assign" && !c.owner) throw new Error("Asigna el caso antes de responder");
    if (action === "resolve" && !c.actions.some((a) => ["contact", "reset", "revoke"].includes(a)))
      throw new Error("Registra una respuesta antes de resolver");
    if (action === "assign") {
      c.owner = "Analista local";
      c.state = "review";
    }
    if (action === "resolve") c.state = "resolved";
    if (action === "dismiss") c.state = "dismissed";
    c.actions.push(action);
    c.audit.push({ at: Date.now(), label: ACTIONS[action] });
    this.save(next);
    return this.list();
  }
}
module.exports = { PilotCases, EVENTS, ACTIONS };
