// Interfaz. Izquierda: lo que ve el cliente en su teléfono (claro, letra grande, una acción por pantalla).
// Derecha: detrás de escena para el jurado (pasos, tiempos, señales, JSON). Los modelos viven en el proceso principal.
"use strict";
const $ = (s) => document.querySelector(s);
const estado = $("#estado");
const tiempos = $("#tiempos");
const tecnico = $("#tecnico");
const zona = $("#zona");
const audio = $("#audio");
let ocupado = false;
let mensajesDisponibles = false;
let llamadasDisponibles = false;
function actualizarAcciones() {
  const bloqueado = ocupado || window.certivaScenarioBusy;
  for (const id of ["#elegir", "#tVerificarMensaje"]) $(id).disabled = bloqueado || !mensajesDisponibles;
  for (const id of ["#llamadaDemo", "#tVerificarLlamada"]) $(id).disabled = bloqueado || !llamadasDisponibles;
  for (const boton of document.querySelectorAll(".ejemplo")) boton.disabled = bloqueado || !mensajesDisponibles;
}
const sesion = [];

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const ICONO_AVISO =
  '<svg class="ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2 1 21h22L12 2zm0 6a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0V9a1 1 0 0 1 1-1zm0 9.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5z"/></svg>';
const ETIQUETA = {
  fraude: "Señales de estafa",
  sospechoso: "Sospechoso",
  sin_senales: "Sin señales de estafa",
  no_legible: "No pude leerlo",
  error: "Error",
};
const ETIQUETA_CORTA = {
  fraude: "Fraude",
  sospechoso: "Sospechoso",
  sin_senales: "Sin señales",
  no_legible: "No legible",
  error: "Error",
};
// Nombres técnicos de las reglas y cómo se los decimos a una persona mayor.
const SENAL = {
  dominio_parecido: "La dirección web imita la del banco",
  dominio_no_oficial: "La dirección web no es del banco",
  ip_literal: "El enlace lleva a una dirección extraña",
  punycode: "El enlace usa letras disfrazadas",
  acortador: "El enlace esconde a dónde lleva",
  numero_no_oficial: "No coincide con los números de referencia",
  pide_datos_sensibles: "Te piden tu clave o tu código",
  envio_para_recibir: "Te piden enviar dinero para recibir más",
  cambio_direccion: "Te piden cambiar la dirección de pago",
  urgencia: "Te meten prisa",
  pago_terceros: "Te piden mover dinero",
};
function pon(txt) {
  estado.textContent = txt;
}

// ---------------------------------------------------------------- teléfono: escala y pantallas
const telefono = $("#telefono");
const marco = $("#marco");
function escalar() {
  const alto = marco.clientHeight - 8;
  const ancho = marco.clientWidth - 8;
  const escala = Math.max(0.45, Math.min(1, alto / 800, ancho / 390));
  telefono.style.transform = `scale(${escala})`;
  marco.style.minHeight = `${Math.round(800 * escala) + 8}px`;
}
new ResizeObserver(escalar).observe(marco);
escalar();
function pantalla(nombre) {
  for (const p of document.querySelectorAll(".p")) p.hidden = p.dataset.p !== nombre;
}
function cuelga(mensaje) {
  $("#tCuelgaTexto").textContent = mensaje;
  $("#tCuelga").hidden = false;
}
$("#tCuelgaOk").onclick = () => {
  $("#tCuelga").hidden = true;
};
$("#tVolver").onclick = () => pantalla("inicio");
$("#tVolver2").onclick = () => pantalla("inicio");
$("#tLlamar").onclick = () => {
  $("#tContacto").hidden = false;
};
$("#tLlamar2").onclick = () => {
  $("#tContacto2").hidden = false;
};
$("#tVerificarMensaje").onclick = async () => analizar(await window.escudo.elegirCaptura());
$("#tVerificarLlamada").onclick = async () => simularLlamada(await window.escudo.llamadaDemo());

// ---------------------------------------------------------------- pasos del análisis
const PASOS = ["vision", "reglas", "veredicto"];
const NOMBRE_PASO = {
  vision: "VisionPsy lee la captura",
  reglas: "Reglas del banco",
  veredicto: "Qwen3 redacta el consejo",
};
function pasosReset() {
  for (const li of document.querySelectorAll("#tPasos li")) {
    li.className = "";
    li.querySelector("em").textContent = "";
    if (li.dataset.paso === "ocr") li.hidden = true;
  }
  tecnico.innerHTML = `<ul class="etapas">${PASOS.map((p) => `<li data-paso="${p}"><b>…</b>${NOMBRE_PASO[p]}</li>`).join("")}</ul>`;
}
function paso(e) {
  const li = document.querySelector(`#tPasos li[data-paso="${e.etapa}"]`);
  if (!li) return;
  let tec = document.querySelector(`.etapas li[data-paso="${e.etapa}"]`);
  if (!tec && e.etapa === "ocr") {
    const ul = document.querySelector(".etapas");
    if (ul) {
      tec = document.createElement("li");
      tec.dataset.paso = "ocr";
      tec.innerHTML = "<b>…</b>Contraste con OCR";
      ul.insertBefore(tec, ul.querySelector('[data-paso="veredicto"]'));
    }
  }
  if (e.estado === "inicio") {
    li.hidden = false;
    li.className = "activo";
    if (tec) tec.classList.add("activo");
  } else {
    li.className = "hecho";
    li.querySelector("em").textContent = `${(e.ms / 1000).toFixed(1)} s`;
    if (tec) {
      tec.classList.remove("activo");
      tec.querySelector("b").textContent = `${e.ms} ms`;
    }
  }
}

// ---------------------------------------------------------------- veredicto
function pintaTelefono(r) {
  const v = r.veredicto || {};
  const tipo = r.ok ? v.veredicto || r.veredicto_reglas : "no_legible";
  const chip = $("#tChip");
  chip.className = `tchip ${tipo}`;
  chip.textContent = ETIQUETA[tipo] || tipo;
  const senales = (v.senales && v.senales.length ? v.senales : r.senales) || [];
  $("#tResumen").textContent =
    !r.ok || tipo === "no_legible"
      ? "La lectura no es concluyente. Revisa el texto o prueba con una imagen más nítida."
      : senales.length
        ? "Encontré estas señales en el mensaje:"
        : "No encontré señales de estafa. Eso no lo vuelve seguro: el banco nunca te pide claves ni códigos.";
  $("#tRazones").innerHTML = senales
    .map(
      (s) => `<li>${ICONO_AVISO}<div><b>${esc(SENAL[s.tipo] || s.tipo)}</b><span>${esc(s.tipo === "numero_no_oficial" ? "El número leído no figura en los canales configurados para este análisis. Esta ausencia no confirma fraude; contrasta con las fuentes del banco." : s.evidencia)}</span></div></li>`,
    )
    .join("");
  $("#tConsejo").textContent =
    window.CertivaContactos.consejoSinTelefonosGenerados(v.accion) || "Ante la duda, no toques el enlace y llama al número oficial impreso en tu tarjeta.";
  pintaVecinos(r.vecinos || []);
  $("#tReportar").disabled = !r.captura || !!r.preliminar;
  $("#tReportar").textContent = r.preliminar ? "Revisión en curso…" : "Reportar este mensaje";
  if (r.preliminar) $("#tResumen").textContent = "Advertencia inicial por señales detectadas. No respondas mientras termina la revisión.";
  $("#tReportar").onclick = async () => {
    if (r.preliminar) return;
    $("#tReportar").disabled = true;
    try {
      if (!r.reportedIndicators) {
        const reps = await window.escudo.reportar(r.captura);
        r.reportedIndicators = true;
        pintaBanco(reps);
      }
      if (!r.reportedCase) {
        await createReportedCase(r);
        r.reportedCase = true;
      }
      $("#tReportar").textContent = "Reporte recibido en el centro de seguridad";
    } catch (e) {
      $("#tReportar").disabled = false;
      $("#tReportar").textContent = "Reintentar reporte";
      pon(e.message || e);
    }
  };
  if (r.reportedCase) {
    $("#tReportar").disabled = true;
    $("#tReportar").textContent = "Reporte recibido en el centro de seguridad";
  }
  pantalla("veredicto");
}
const NOMBRE_IND = { dominio: "esta dirección web", numero: "este número", remitente: "este remitente" };
function pintaVecinos(vecinos) {
  const el = $("#tVecinos");
  if (!vecinos.length) {
    el.hidden = true;
    return;
  }
  const v = vecinos.sort((a, b) => b.vecinos - a.vecinos)[0];
  el.hidden = false;
  el.textContent =
    v.vecinos === 1
      ? `Un nodo ya reportó ${NOMBRE_IND[v.tipo] || v.tipo}.`
      : `${v.vecinos} nodos ya reportaron ${NOMBRE_IND[v.tipo] || v.tipo}.`;
}
let ultimoAnalisis = null;
function pintaTecnico(r) {
  const v = r.veredicto || {};
  const senales = (v.senales && v.senales.length ? v.senales : r.senales) || [];
  const conf = typeof v.confianza === "number" ? `${Math.round(v.confianza * 100)}%` : "—";
  const pasosHtml = r.tiempos
    ? `<ul class="etapas"><li><b>${r.tiempos.extraccion_ms} ms</b>${r.origen === "texto" ? "Texto recibido" : "VisionPsy"} · primer token ${r.tiempos.extraccion_ttft_ms ?? "—"} ms</li><li><b>&lt; 1 ms</b>Reglas del banco</li><li><b>${r.tiempos.veredicto_ms} ms</b>Qwen3 · primer token ${r.tiempos.veredicto_ttft_ms ?? "—"} ms</li></ul>`
    : "";
  const contrasteHtml = r.contraste?.usado
    ? `<p class="mini">Contraste con OCR (${r.contraste.ms} ms): ${r.contraste.correcciones.length ? r.contraste.correcciones.map((c) => `${esc(c.de)} era en realidad ${esc(c.a)}`).join("; ") : `el OCR también lee ${esc(r.contraste.dominios_sospechosos.join(", "))}: la señal se mantiene`}</p>`
    : "";
  tecnico.innerHTML = `${pasosHtml}${contrasteHtml}${r.revision ? `<p class="mini">Segunda lectura: ${esc(r.revision.estado)} · ${r.revision.ms} ms. Coincidir no confirma autenticidad.</p>` : ""}
    <div><span class="chip ${esc(v.veredicto || r.veredicto_reglas || "no_legible")}">${esc(ETIQUETA_CORTA[v.veredicto || r.veredicto_reglas] || "—")}</span> <span class="mini">estimación del modelo ${conf} (no calibrada) · reglas: ${esc(r.veredicto_reglas || "—")} · ${esc((r.modelos && r.modelos.vision) || "")} + ${esc((r.modelos && r.modelos.texto) || "")}</span></div>
    ${senales.length ? `<ul class="senales">${senales.map((s) => `<li><b>${esc(s.tipo)}</b><span>${esc(s.evidencia)}</span></li>`).join("")}</ul>` : `<p class="mini">Sin señales por reglas.</p>`}
    ${r.captura ? `<p class="leido"><b>${esc(r.captura.canal)}</b> · de <b>${esc(r.captura.remitente || "remitente no identificado")}</b>\n${esc(r.captura.texto)}</p>` : ""}
    <details><summary>JSON completo</summary><pre>${esc(JSON.stringify({ captura: r.captura, senales: r.senales, veredicto: r.veredicto, tiempos: r.tiempos, modelos: r.modelos, detalle: r.detalle }, null, 2))}</pre></details>`;
  if (r.tiempos)
    tiempos.textContent = `${r.origen === "texto" ? "texto" : "visión"} ${r.tiempos.extraccion_ms} ms · veredicto ${r.tiempos.veredicto_ms} ms · total ${r.tiempos.total_ms ?? r.tiempos.extraccion_ms + r.tiempos.veredicto_ms} ms`;
}
function pintaHistorial() {
  const h = $("#historial");
  const ul = $("#historialLista");
  if (!sesion.length) {
    h.hidden = true;
    return;
  }
  h.hidden = false;
  ul.innerHTML = sesion
    .map((r, i) => {
      const t = r.ok ? (r.veredicto && r.veredicto.veredicto) || r.veredicto_reglas : "error";
      return `<li data-i="${i}"><span class="chip ${t}">${ETIQUETA_CORTA[t] || t}</span><span>${esc(r.nombre)}</span></li>`;
    })
    .join("");
  for (const li of ul.querySelectorAll("li")) {
    li.onclick = () => {
      const r = sesion[Number(li.dataset.i)];
      pintaTelefono(r);
      pintaTecnico(r);
    };
  }
}
async function analizar(ruta, options = {}) {
  if (ocupado || !ruta || !mensajesDisponibles) return;
  ocupado = true;
  actualizarAcciones();
  pasosReset();
  if (options.messageId) {
    const visual = document.querySelector('.etapas li[data-paso="vision"]');
    if (visual) visual.innerHTML = "<b>…</b>Texto recibido · sin lectura de imagen";
  }
  if (!options.background) {
    $("#certivaNotification").hidden = true;
    $("#sourceNotification").hidden = true;
    pantalla("analizando");
  }
  pon("analizando");
  try {
    const r = options.messageId ? await window.escudo.analizarMensaje(options.messageId) : await window.escudo.analizar(ruta);
    r.nombre = ruta.split("/").pop();
    sesion.unshift(r);
    ultimoAnalisis = r;
    pendingAssessment = r;
    pintaHistorial();
    if (options.background) assessmentArrived(r);
    else pintaTelefono(r);
    pintaTecnico(r);
    pon("listo");
  } catch (e) {
    const failure = { ok: false, detalle: String(e.message || e) };
    if (options.background) assessmentArrived(failure);
    else pintaTelefono(failure);
    tecnico.innerHTML = `<p class="mini">Error: ${esc(e.message || e)}</p>`;
    pon("error");
  } finally {
    ocupado = false;
    actualizarAcciones();
  }
}

// ---------------------------------------------------------------- llamada
let cola = [];
function limpiarLlamada() {
  cola = [];
  $("#tTranscripcion").innerHTML = "";
  $("#tBanner").hidden = true;
  $("#tCuelga").hidden = true;
  tecnico.innerHTML = `<ol class="transcripcion" id="transcripcion"></ol>`;
}
function muestraLlamada(item) {
  const tel = $("#tTranscripcion");
  const tec = $("#transcripcion");
  if (item.tipo) {
    const li = document.createElement("li");
    li.className = "aviso";
    li.textContent = item.mensaje;
    tel.appendChild(li);
    $("#tBanner").hidden = false;
    $("#tBanner").textContent = item.mensaje;
    cuelga(item.mensaje);
    if (tec) {
      const t = document.createElement("li");
      t.className = "aviso";
      t.innerHTML = `${ICONO_AVISO}${esc(item.tipo)} · «${esc(item.frase)}»`;
      tec.appendChild(t);
    }
  } else {
    const li = document.createElement("li");
    li.textContent = item.texto || "…";
    tel.appendChild(li);
    if (tec) {
      const t = document.createElement("li");
      t.innerHTML = `<span class="t">${Math.round(item.t0)}–${Math.round(item.t1)} s · ${item.ms} ms</span><span>${esc(item.texto || "…")}</span>`;
      tec.appendChild(t);
    }
  }
  tel.lastElementChild.scrollIntoView({ block: "nearest" });
}
// Los lotes se transcriben más rápido que el tiempo real: se muestran cuando el audio los alcanza, como en vivo.
function vaciarCola() {
  const t = audio.currentTime;
  while (cola.length && (audio.paused || audio.ended || cola[0].t <= t + 0.2)) muestraLlamada(cola.shift());
}
audio.addEventListener("timeupdate", vaciarCola);
audio.addEventListener("ended", vaciarCola);
window.escudo.on("llamada-segmento", (s) => {
  cola.push({ ...s, t: s.t1 });
  vaciarCola();
});
window.escudo.on("llamada-alerta", (a) => {
  cola.push({ ...a, t: a.t });
  vaciarCola();
});
window.escudo.on("llamada-fin", (r) => {
  const esperar = () => {
    if (cola.length || (!audio.paused && !audio.ended)) {
      setTimeout(esperar, 400);
      return;
    }
    const v = r.resumen || {};
    const chip = $("#tChipLlamada");
    chip.className = `tchip ${esc(v.veredicto || "sospechoso")}`;
    chip.textContent = ETIQUETA[v.veredicto] || v.veredicto;
    $("#tResumenLlamada").textContent = v.resumen || "";
    $("#tConsejoLlamada").textContent = window.CertivaContactos.consejoSinTelefonosGenerados(v.accion);
    $("#tCuelga").hidden = true;
    pantalla("fin-llamada");
    tecnico.insertAdjacentHTML(
      "beforeend",
      `<p class="mini">${r.segmentos.length} lotes de 5 s transcritos con Parakeet · ${r.alertas.length} avisos por reglas · resumen de Qwen3 en ${v.ms ?? "—"} ms</p>`,
    );
    tiempos.textContent = `llamada de ${Math.round(r.duracion_s)} s · ${r.segmentos.length} lotes · resumen ${v.ms ?? "—"} ms`;
    pon("listo");
  };
  esperar();
});
async function simularLlamada(ruta) {
  if (ocupado || !ruta || !llamadasDisponibles) return;
  limpiarLlamada();
  pantalla("llamada");
  audio.hidden = false;
  audio.src = `file://${ruta}`;
  audio.currentTime = 0;
  pon("transcribiendo la llamada");
  try {
    await audio.play();
  } catch {
    /* sin autoplay: el usuario pulsa play */
  }
  try {
    await window.escudo.llamadaIniciar(ruta);
  } catch (e) {
    pon(`error: ${e.message || e}`);
  }
}
$("#llamadaDemo").onclick = async () => simularLlamada(await window.escudo.llamadaDemo());

// ---------------------------------------------------------------- panel: ejemplos, arrastre, pestañas, banco, red
const EJEMPLOS = [
  ["fraude-bloqueo_enlace-01", "SMS: «cuenta bloqueada»", "Fraude con enlace parecido"],
  ["fraude-ejecutivo_whatsapp-01", "WhatsApp: «ejecutivo del banco»", "Fraude que pide el código"],
  ["legitimo-otp_legitimo-01", "SMS: código de verificación", "Legítimo"],
  ["legitimo-correo_estado_cuenta-01", "Correo: estado de cuenta", "Legítimo"],
  ["fraude-billetera_semilla-01", "WhatsApp: «soporte de billetera»", "Fraude que pide la frase semilla"],
];
async function pintaEjemplos() {
  const todas = await window.escudo.capturasDemo();
  const porId = new Map(todas.map((c) => [c.id, c]));
  $("#ejemplos").innerHTML = EJEMPLOS.filter(([id]) => porId.has(id))
    .map(
      ([id, titulo, sub]) =>
        `<button type="button" class="ejemplo" data-id="${esc(id)}"><span class="scenario-icon" data-channel="${id.includes("whatsapp") ? "whatsapp" : id.includes("correo") ? "correo" : "sms"}"><svg class="android-icon" aria-hidden="true"><use href="#android-${id.includes("whatsapp") ? "whatsapp" : id.includes("correo") ? "mail" : "messages"}"/></svg></span><span>${esc(titulo)}<small>${esc(sub)}</small></span></button>`,
    )
    .join("");
  for (const b of document.querySelectorAll(".ejemplo")) b.onclick = () => receiveScenario(porId.get(b.dataset.id), b);
}
$("#elegir").onclick = async () => analizar(await window.escudo.elegirCaptura());
for (const ev of ["dragenter", "dragover"])
  zona.addEventListener(ev, (e) => {
    e.preventDefault();
    zona.classList.add("sobre");
  });
for (const ev of ["dragleave", "drop"])
  zona.addEventListener(ev, (e) => {
    e.preventDefault();
    zona.classList.remove("sobre");
  });
zona.addEventListener("drop", (e) => {
  const f = e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) analizar(window.escudo.rutaDeArchivo(f));
});
document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("drop", (e) => e.preventDefault());
for (const t of document.querySelectorAll(".tab")) {
  t.onclick = () => {
    for (const x of document.querySelectorAll(".tab")) {
      x.classList.toggle("activa", x === t);
      x.setAttribute("aria-selected", String(x === t));
    }
    $("#vistaCliente").hidden = t.dataset.tab !== "cliente";
    $("#vistaBanco").hidden = t.dataset.tab !== "banco";
    escalar();
  };
}
function pintaPares(estado, log) {
  const e = estado || {};
  $("#paresEstado").innerHTML =
    `<span>Pares conectados: <b>${e.pares ?? 0}</b></span><span>Indicadores conocidos: <b>${e.indicadores ?? 0}</b></span><span>Este nodo: <b>${esc(String(e.nodo || "—").slice(0, 8))}</b></span>`;
  if (log) $("#paresLog").textContent = log.join("\n");
}
const revisionesBanco = new Map(); // Solo sesión local; no altera reportes ni confirma fraude.
function pintaBanco(reps) {
  const porTipo = {};
  for (const r of reps) porTipo[r.tipo] = (porTipo[r.tipo] || 0) + 1;
  const ultimaHora = reps.filter((r) => Date.now() - r.ts < 3600000).length;
  $("#kpis").innerHTML = [
    ["Indicadores", reps.length],
    ["Última hora", ultimaHora],
    ["Dominios", porTipo.dominio || 0],
    ["Números", porTipo.numero || 0],
    ["Remitentes", porTipo.remitente || 0],
  ]
    .map(([k, v]) => `<div class="kpi"><b>${v}</b><span>${k}</span></div>`)
    .join("");
  $("#tablaReportes tbody").innerHTML =
    reps
      .slice()
      .reverse()
      .slice(0, 50)
      .map(
        (r) =>
          `<tr><td>${new Date(r.ts).toLocaleTimeString("es-PA")}</td><td>${esc(r.tipo)}</td><td>${esc(r.hash)}</td><td>${esc(r.origen)}</td><td><button type="button" data-revision="${esc(`${r.tipo}:${r.hash}`)}">${esc(revisionesBanco.get(`${r.tipo}:${r.hash}`) || "Marcar para investigar")}</button></td></tr>`,
      )
      .join("") || `<tr><td colspan="5">Todavía no hay reportes.</td></tr>`;
  for (const boton of document.querySelectorAll("[data-revision]")) {
    boton.onclick = () => {
      revisionesBanco.set(boton.dataset.revision, "Pendiente de investigación");
      boton.textContent = "Pendiente de investigación";
      boton.disabled = true;
    };
  }
}
async function medirRed() {
  try {
    const r = await window.escudo.red();
    const el = $("#red");
    const n = $("#redNube");
    if (r.nube === null) {
      n.textContent = "n/d";
      $("#redPares").textContent = "n/d";
      el.title = "Medición no disponible; no equivale a ausencia de tráfico.";
      return;
    }
    n.textContent = String(r.nube);
    $("#redPares").textContent = String(r.pares ?? 0);
    el.classList.toggle("alerta", r.nube > 0);
    el.title = r.detalle.length
      ? r.detalle.map((d) => `${d.proceso} → ${d.destino}${d.local ? " (local)" : ""}`).join("\n")
      : "Sin conexiones TCP establecidas";
  } catch {
    /* */
  }
}

(async () => {
  window.escudo.on("ocupado", (v) => {
    ocupado = v;
    actualizarAcciones();
  });
  window.escudo.on("progreso-modelo", (p) => pon(`cargando ${p.modelo} ${Math.round(p.porcentaje)}%`));
  window.escudo.on("progreso-descarga", (p) => pon(`descargando ${p.modelo} ${Math.round(p.porcentaje)}%`));
  window.escudo.on("analisis-etapa", paso);
  window.escudo.on("analisis-alerta", r => {
    if (experienceBusy && r.preliminar) assessmentArrived(r);
  });
  await pintaEjemplos();
  const st = await window.escudo.estado();
  const listo = (grupo, key) => st.modelos?.[grupo]?.some((m) => m.key === key && m.enCache);
  mensajesDisponibles = listo("vision", "visionpsy-flash") && listo("texto", "qwen3-4b");
  llamadasDisponibles = mensajesDisponibles && listo("voz", "parakeet-tdt");
  actualizarAcciones();
  $("#modelos").textContent =
    `VisionPsy Nano 460M Flash · Qwen3 4B · SDK ${st.sdk} · ${st.hardware.cpu}, ${st.hardware.ram_gb} GB · inferencia local`;
  const aviso =
    st.sdk === "?"
      ? "Para verificar mensajes en este equipo, instala QVAC y descarga los modelos locales."
      : !mensajesDisponibles
        ? "Falta preparar los modelos para verificar mensajes. Consulta las instrucciones de instalación del proyecto."
        : !llamadasDisponibles
          ? "Verificación de mensajes disponible. Las llamadas requieren descargar el modelo de voz."
          : "";
  $("#setupNotice").hidden = !aviso;
  $("#setupNotice").textContent = aviso;
  for (const id of ["#llamadaDemo", "#tVerificarLlamada"])
    $(id).title = llamadasDisponibles ? "Explorar una llamada de ejemplo" : "Modelo de voz pendiente de descarga";
  pintaBanco(st.reportes || []);
  pintaPares(st.pares, []);
  try {
    const pp = await window.escudo.pares();
    pintaPares(pp.estado, pp.log);
  } catch {
    /* sin pares */
  }
  window.escudo.on("pares-estado", (e) => pintaPares(e));
  window.escudo.on("pares-log", (l) => {
    const pre = $("#paresLog");
    pre.textContent = `${pre.textContent}\n${l}`.trim();
  });
  window.escudo.on("pares-indicador", async () => {
    const st2 = await window.escudo.estado();
    pintaBanco(st2.reportes || []);
    pintaPares(st2.pares);
    if (ultimoAnalisis?.ok) {
      const r2 = await window.escudo.analizarVecinos(ultimoAnalisis.captura);
      ultimoAnalisis.vecinos = r2;
      if (!$('[data-p="veredicto"]').hidden) pintaVecinos(r2);
    }
  });
  medirRed();
  setInterval(medirRed, 3000);
  const auto = await window.escudo.demoAuto();
  if (auto?.captura) setTimeout(() => analizar(auto.captura), 1800);
  if (auto?.llamada) simularLlamada(auto.llamada);
})();
