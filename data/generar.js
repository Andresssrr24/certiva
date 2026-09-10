// Generador de mensajes sintéticos con verdad conocida. Determinista: misma semilla, mismos datos.
// Produce data/mensajes.json, data/verdad.json y un HTML por mensaje en data/html/.
// Ningún dato real: banco ficticio, nombres inventados, números y dominios sintéticos.
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const banco = require("./banco-demo.json");
const P = require("./plantillas");

const SEMILLA = 20260910;
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = rng(SEMILLA);
const pick = (a) => a[Math.floor(R() * a.length)];
const chance = (p) => R() < p;
const digitos = (n) => Array.from({ length: n }, () => Math.floor(R() * 10)).join("");
const movil = () => `6${digitos(3)}-${digitos(4)}`;
const movilConPrefijo = () => `+507 ${movil()}`;
const monto = () => `B/. ${Math.floor(R() * 900) + 20}.${pick(["00", "50", "75", "99", "25"])}`;
const nombres = [
  "Carlos Pérez",
  "Ana Gómez",
  "Luis Batista",
  "María Rodríguez",
  "José Castillo",
  "Yaritza Moreno",
  "Roberto Herrera",
  "Katherine De León",
];
const lugares = [
  "Albrook",
  "Multiplaza",
  "David",
  "Santiago",
  "Chitré",
  "Colón",
  "Penonomé",
  "Vía España",
  "Costa del Este",
  "La Chorrera",
];
const comercios = [
  "Super 99",
  "Riba Smith",
  "Farmacias Arrocha",
  "Amazon",
  "Netflix",
  "El Machetazo",
  "Uber",
  "PriceSmart",
];
const fechas = [
  "3 de septiembre",
  "5 de septiembre",
  "8 de septiembre",
  "9 de septiembre",
  "10 de septiembre",
  "12 de septiembre",
  "15 de septiembre",
];
const horas = () => `${Math.floor(R() * 12) + 1}:${pick(["05", "12", "24", "37", "48", "53"])}`;
const codigo = () => digitos(6);
const parecido = () => pick(banco.dominios_parecidos);
const acortado = () =>
  `https://${pick(banco.acortadores)}/${digitos(2)}${pick(["Kd", "xQ", "Bz", "pT", "Lm"])}${digitos(2)}`;
const ip = () =>
  `http://${pick([181, 186, 190, 200])}.${digitos(2)}.${digitos(3)}.${digitos(2)}/bancodemo/${pick(["verificar", "acceso", "seguridad"])}`;
const oficialApp = "https://app.bancodemo.com.pa";
const telOficial = () => pick(banco.telefonos_oficiales);
const senderOficialSms = pick(banco.remitentes_oficiales.slice(0, 2));

// ---------- fraude ----------
const FRAUDE = {
  bloqueo_enlace: () => {
    const d = parecido();
    const t = pick([
      `${banco.nombre}: Su cuenta ha sido bloqueada por actividad inusual. Verifique su identidad en https://${d}/verificar antes de 24 horas o será cancelada.`,
      `Estimado cliente de ${banco.nombre}, detectamos un acceso desde otro dispositivo. Para evitar el bloqueo de su cuenta confirme sus datos hoy mismo en https://${d}/seguridad`,
      `${banco.nombre.toUpperCase()} - AVISO URGENTE: su tarjeta será suspendida. Reactívela de inmediato en https://${d}/reactivar`,
    ]);
    return {
      canal: pick(["sms", "whatsapp"]),
      remitente: pick([movilConPrefijo(), `+1 (${digitos(3)}) ${digitos(3)}-${digitos(4)}`, "ALERTA-BANCO"]),
      texto: t,
      enlaces: [`https://${d}/${t.split(`https://${d}/`)[1].split(/[\s.]/)[0]}`],
      telefonos: [],
      montos: [],
      pide: false,
      urgencia: true,
      senales: ["dominio_parecido", "urgencia"],
    };
  },
  reembolso_acortador: () => {
    const m = monto();
    const e = acortado();
    const t = pick([
      `${banco.nombre}: tiene un reembolso de ${m} pendiente por cobro duplicado. Reclámelo aquí: ${e}`,
      `Felicidades, usted fue seleccionado para una devolución de ${m} de ${banco.nombre}. Solicítela en ${e} antes de que expire.`,
      `Su bono de fidelidad de ${m} está listo. Actívelo en ${e}`,
    ]);
    const urg = /antes de|expire/.test(t);
    return {
      canal: pick(["sms", "whatsapp"]),
      remitente: pick([movilConPrefijo(), "PROMO", movilConPrefijo()]),
      texto: t,
      enlaces: [e],
      telefonos: [],
      montos: [m],
      pide: false,
      urgencia: urg,
      senales: ["acortador", ...(urg ? ["urgencia"] : [])],
    };
  },
  pide_codigo: () => {
    const t = pick([
      `${banco.nombre}: hemos detectado un intento de acceso a su cuenta. Para cancelarlo responda a este mensaje con el código de 6 dígitos que le acabamos de enviar.`,
      `Seguridad ${banco.nombre}: confirme su identidad enviando su clave de banca en línea y el código que recibirá por SMS. De lo contrario su cuenta quedará suspendida.`,
      `Para activar la nueva tarjeta indique el PIN actual y los últimos 4 dígitos de la tarjeta respondiendo a este mensaje.`,
    ]);
    const urg = /suspendida|cancelarlo|de lo contrario/i.test(t);
    return {
      canal: pick(["sms", "whatsapp", "sms"]),
      remitente: pick([movilConPrefijo(), "BANC0DEMO", movilConPrefijo()]),
      texto: t,
      enlaces: [],
      telefonos: [],
      montos: [],
      pide: true,
      urgencia: urg,
      senales: ["pide_datos_sensibles", ...(urg ? ["urgencia"] : [])],
    };
  },
  pago_yappy: () => {
    const m = monto();
    const n = movil();
    const t = pick([
      `${banco.nombre}: su cuota del préstamo está vencida. Para evitar cargos realice el pago de ${m} por Yappy al ${n} hoy mismo.`,
      `Cobros ${banco.nombre}: regularice su tarjeta transfiriendo ${m} a la cuenta de nuestro gestor, ${pick(nombres)}, al ${n} antes de las 5 p.m.`,
      `Aviso: pago pendiente de ${m}. Envíe el monto por Yappy al ${n} para evitar la suspensión del servicio.`,
    ]);
    return {
      canal: pick(["sms", "whatsapp"]),
      remitente: pick([movilConPrefijo(), "COBROS"]),
      texto: t,
      enlaces: [],
      telefonos: [n],
      montos: [m],
      pide: false,
      urgencia: true,
      senales: ["pago_terceros", "numero_no_oficial", "urgencia"],
    };
  },
  correo_actualizacion: () => {
    const d = parecido();
    const t = pick([
      `Estimado cliente,\n\nPor disposición regulatoria todos los usuarios deben actualizar sus datos antes del ${pick(fechas)}. Ingrese con su usuario y clave en https://${d}/actualizar para mantener su cuenta activa.\n\nAtentamente,\nDepartamento de Seguridad`,
      `Hola,\n\nSu estado de cuenta presenta una inconsistencia. Para revisarla confirme su número de tarjeta y clave en https://${d}/revision. Si no lo hace en 48 horas la cuenta será limitada.\n\nServicio al cliente`,
    ]);
    return {
      canal: "correo",
      remitente: pick([`seguridad@${d}`, `notificaciones@${d}`, `alertas@${d}`]),
      remitenteNombre: pick([`${banco.nombre} Seguridad`, banco.nombre, `Alertas ${banco.nombre}`]),
      asunto: pick([
        "Actualización obligatoria de datos",
        "Acción requerida: verifique su cuenta",
        "Inconsistencia en su estado de cuenta",
      ]),
      texto: t,
      enlaces: [`https://${d}/${t.split(`https://${d}/`)[1].split(/[\s.]/)[0]}`],
      telefonos: [],
      montos: [],
      pide: true,
      urgencia: true,
      senales: ["dominio_parecido", "pide_datos_sensibles", "urgencia"],
    };
  },
  ejecutivo_whatsapp: () => {
    const n = pick(nombres);
    const t = pick([
      `Buenos días, le habla ${n}, ejecutivo de ${banco.nombre}. Para activar el beneficio de su cuenta necesito que me confirme su clave de banca en línea y el código que le llegará por SMS.`,
      `Hola, soy ${n} del departamento de tarjetas de ${banco.nombre}. Vamos a bloquear un cargo sospechoso, dígame por favor el código de verificación que acaba de recibir.`,
      `Saludos, ${n} de ${banco.nombre}. Tenemos una promoción exclusiva, para aplicarla comparta su usuario, clave y el número completo de su tarjeta.`,
    ]);
    return {
      canal: "whatsapp",
      remitente: movilConPrefijo(),
      texto: t,
      enlaces: [],
      telefonos: [],
      montos: [],
      pide: true,
      urgencia: false,
      senales: ["pide_datos_sensibles"],
    };
  },
  compra_no_reconocida: () => {
    const d = parecido();
    const m = monto();
    const c = pick(comercios);
    const t = pick([
      `${banco.nombre}: compra por ${m} en ${c}. Si NO reconoce esta transacción cancélela de inmediato en https://${d}/cancelar`,
      `Alerta ${banco.nombre}: se aprobó un cargo de ${m} en ${c}. ¿No fue usted? Bloquee su tarjeta ahora en https://${d}/bloqueo`,
    ]);
    return {
      canal: "sms",
      remitente: pick([movilConPrefijo(), "ALERTAS", `+1 (${digitos(3)}) ${digitos(3)}-${digitos(4)}`]),
      texto: t,
      enlaces: [`https://${d}/${t.split(`https://${d}/`)[1].split(/[\s.]/)[0]}`],
      telefonos: [],
      montos: [m],
      pide: false,
      urgencia: true,
      senales: ["dominio_parecido", "urgencia"],
    };
  },
  ip_literal: () => {
    const e = ip();
    const t = pick([
      `${banco.nombre}: actualice su token de seguridad en ${e} para seguir usando la banca en línea.`,
      `Su acceso vence hoy. Renueve su clave de ${banco.nombre} en ${e}`,
    ]);
    const urg = /vence hoy/.test(t);
    return {
      canal: pick(["sms", "whatsapp"]),
      remitente: pick([movilConPrefijo(), "SEGURIDAD"]),
      texto: t,
      enlaces: [e],
      telefonos: [],
      montos: [],
      pide: false,
      urgencia: urg,
      senales: ["ip_literal", ...(urg ? ["urgencia"] : [])],
    };
  },
};

// ---------- legítimos ----------
const LEGITIMO = {
  alerta_transaccion: () => {
    const m = monto();
    const tel = telOficial();
    const t = pick([
      `${banco.nombre}: retiro por ${m} en ATM ${pick(lugares)} el ${pick(fechas)} a las ${horas()}. Si no fue usted, llame al ${tel}.`,
      `${banco.nombre}: compra aprobada por ${m} en ${pick(comercios)}. Consultas al ${tel}.`,
      `${banco.nombre}: se acreditó un depósito de ${m} en su cuenta de ahorros. Saldo disponible en la app oficial.`,
    ]);
    const tels = t.includes(tel) ? [tel] : [];
    return {
      canal: "sms",
      remitente: senderOficialSms,
      texto: t,
      enlaces: [],
      telefonos: tels,
      montos: [m],
      pide: false,
      urgencia: false,
      senales: [],
      veredicto: "sin_senales",
    };
  },
  otp_legitimo: () => {
    const c = codigo();
    const t = pick([
      `${banco.nombre}: su código de verificación es ${c}. No lo comparta con nadie, ni siquiera con el banco.`,
      `${c} es su código para ingresar a la banca en línea de ${banco.nombre}. Vence en 5 minutos. Nunca lo compartas.`,
    ]);
    return {
      canal: "sms",
      remitente: senderOficialSms,
      texto: t,
      enlaces: [],
      telefonos: [],
      montos: [],
      pide: false,
      urgencia: false,
      senales: [],
      veredicto: "sin_senales",
    };
  },
  recordatorio_pago: () => {
    const m = monto();
    const t = pick([
      `${banco.nombre}: le recordamos que su cuota de préstamo de ${m} vence el ${pick(fechas)}. Puede pagar en la app oficial o en ${oficialApp}`,
      `Recordatorio ${banco.nombre}: el pago mínimo de su tarjeta es ${m} y vence el ${pick(fechas)}. Gestione su pago en ${oficialApp}`,
    ]);
    return {
      canal: "sms",
      remitente: senderOficialSms,
      texto: t,
      enlaces: [oficialApp],
      telefonos: [],
      montos: [m],
      pide: false,
      urgencia: false,
      senales: [],
      veredicto: "sin_senales",
    };
  },
  correo_estado_cuenta: () => {
    const mes = pick(["agosto", "julio", "junio"]);
    const t = pick([
      `Hola,\n\nSu estado de cuenta de ${mes} ya está disponible. Puede consultarlo ingresando a ${oficialApp} o desde la app oficial.\n\nRecuerde: ${banco.nombre} nunca le pedirá su clave ni códigos por correo.\n\nEquipo de ${banco.nombre}`,
      `Estimado cliente,\n\nLe informamos que el ${pick(fechas)} nuestras sucursales de ${pick(lugares)} atenderán en horario reducido. La app y ${oficialApp} funcionan con normalidad.\n\n${banco.nombre}`,
    ]);
    return {
      canal: "correo",
      remitente: "notificaciones@bancodemo.com.pa",
      remitenteNombre: banco.nombre,
      asunto: pick([`Su estado de cuenta de ${mes} está disponible`, "Información de horarios de atención"]),
      texto: t,
      enlaces: [oficialApp],
      telefonos: [],
      montos: [],
      pide: false,
      urgencia: false,
      senales: [],
      veredicto: "sin_senales",
    };
  },
  whatsapp_oficial: () => {
    const t = pick([
      `Hola, le saluda ${banco.nombre}. Le recordamos que el ${pick(fechas)} es feriado y nuestras sucursales estarán cerradas. La app funciona con normalidad. Nunca compartas tus claves.`,
      `${banco.nombre} informa: ya está disponible la nueva versión de la app en las tiendas oficiales. No la descargue desde enlaces de mensajes.`,
    ]);
    return {
      canal: "whatsapp",
      remitente: "Banco Demo +507 300-1234",
      verificado: true,
      texto: t,
      enlaces: [],
      telefonos: ["+507 300-1234"],
      montos: [],
      pide: false,
      urgencia: false,
      senales: [],
      veredicto: "sin_senales",
    };
  },
  neutral: () => {
    const t = pick([
      `Hola, su paquete llegará hoy entre 2 y 5 p.m. Gracias por su compra.`,
      `Recordatorio: cita odontológica el ${pick(fechas)} a las ${horas()} en ${pick(lugares)}. Confirme respondiendo SI.`,
      `Mami, ya llegué a casa. Te llamo más tarde.`,
      `${pick(comercios)}: este fin de semana 20% de descuento en toda la tienda.`,
    ]);
    return {
      canal: pick(["sms", "whatsapp"]),
      remitente: pick([movilConPrefijo(), pick(nombres), "ENVIOS"]),
      texto: t,
      enlaces: [],
      telefonos: [],
      montos: [],
      pide: false,
      urgencia: false,
      senales: [],
      veredicto: "sin_senales",
    };
  },
  oficial_con_urgencia: () => {
    const t = pick([
      `${banco.nombre}: actualice su app hoy mismo para seguir usando la banca en línea. Descárguela en ${oficialApp}`,
      `${banco.nombre}: último aviso, su tarjeta de débito vence el ${pick(fechas)}. Retire la nueva en su sucursal.`,
    ]);
    return {
      canal: "sms",
      remitente: senderOficialSms,
      texto: t,
      enlaces: t.includes(oficialApp) ? [oficialApp] : [],
      telefonos: [],
      montos: [],
      pide: false,
      urgencia: true,
      senales: ["urgencia"],
      veredicto: "sospechoso",
    };
  },
};

function generar({ porTipo = 8 } = {}) {
  const mensajes = [];
  let n = 0;
  const agrega = (grupo, tipo, fn, veredictoBase) => {
    for (let i = 0; i < porTipo; i++) {
      const m = fn();
      n += 1;
      const id = `${grupo}-${tipo}-${String(i + 1).padStart(2, "0")}`;
      mensajes.push({
        id,
        grupo,
        tipo,
        canal: m.canal,
        remitente: m.remitente,
        remitenteNombre: m.remitenteNombre,
        asunto: m.asunto,
        verificado: !!m.verificado,
        hora: horas(),
        texto: m.texto,
        enlaces: m.enlaces,
        telefonos: m.telefonos,
        montos: m.montos,
        pide_datos_sensibles: m.pide,
        urgencia: m.urgencia,
        esperado: { veredicto: m.veredicto || veredictoBase, senales: m.senales },
      });
    }
  };
  for (const [tipo, fn] of Object.entries(FRAUDE)) agrega("fraude", tipo, fn, "fraude");
  for (const [tipo, fn] of Object.entries(LEGITIMO)) agrega("legitimo", tipo, fn, "sin_senales");
  return mensajes;
}

function escribir(mensajes) {
  const dir = path.join(__dirname, "html");
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) if (f.endsWith(".html")) fs.unlinkSync(path.join(dir, f));
  for (const m of mensajes) {
    const html = m.canal === "correo" ? P.correo(m) : m.canal === "whatsapp" ? P.whatsapp(m) : P.sms(m);
    fs.writeFileSync(path.join(dir, `${m.id}.html`), html);
  }
  fs.writeFileSync(path.join(__dirname, "mensajes.json"), JSON.stringify(mensajes, null, 2));
  const verdad = {};
  for (const m of mensajes) {
    verdad[m.id] = {
      canal: m.canal,
      remitente: m.remitente,
      texto: m.texto,
      enlaces: m.enlaces,
      telefonos: m.telefonos,
      montos: m.montos,
      pide_datos_sensibles: m.pide_datos_sensibles,
      urgencia: m.urgencia,
      esperado: m.esperado,
    };
  }
  fs.writeFileSync(path.join(__dirname, "verdad.json"), JSON.stringify(verdad, null, 2));
  return {
    total: mensajes.length,
    fraude: mensajes.filter((m) => m.grupo === "fraude").length,
    legitimo: mensajes.filter((m) => m.grupo === "legitimo").length,
    dir,
  };
}

if (require.main === module) {
  const porTipo = Number(process.argv[2]) || 8;
  const r = escribir(generar({ porTipo }));
  console.log(`Generados ${r.total} mensajes (${r.fraude} fraude, ${r.legitimo} legítimos) en ${r.dir}`);
  console.log("Ahora renderiza las capturas: npx electron data/render.js");
}

module.exports = { generar, escribir };
