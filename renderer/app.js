// Interfaz: una captura entra y sale un veredicto con razones. La lógica de modelos vive en el proceso principal.
"use strict";
const $ = (s) => document.querySelector(s);
const zona = $("#zona"),
  figura = $("#figura"),
  vista = $("#vista"),
  res = $("#resultado"),
  estado = $("#estado"),
  tiempos = $("#tiempos");
let ocupado = false;
const sesion = [];

const esc = (s) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
const ICONO_AVISO =
  '<svg class="ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2 1 21h22L12 2zm0 6a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0V9a1 1 0 0 1 1-1zm0 9.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5z"/></svg>';
const ETIQUETA = {
  fraude: "Fraude",
  sospechoso: "Sospechoso",
  sin_senales: "Sin señales",
  no_legible: "No pude leerlo",
  error: "Error",
};
const NOMBRE_SENAL = {
  dominio_parecido: "dominio parecido",
  dominio_no_oficial: "dominio no oficial",
  ip_literal: "enlace a una IP",
  punycode: "caracteres disfrazados",
  acortador: "enlace acortado",
  numero_no_oficial: "número no oficial",
  pide_datos_sensibles: "pide clave o código",
  urgencia: "presión de tiempo",
  pago_terceros: "pago a terceros",
};
function pon(txt) {
  estado.textContent = txt;
}

function pinta(r) {
  if (!r.ok) {
    res.innerHTML = `<div class="cabecera"><span class="chip no_legible">No pude leerlo</span></div><p class="regla">La captura no se pudo interpretar. Prueba con una imagen más nítida. Ante la duda, no toques el enlace y llama al número oficial impreso en tu tarjeta.</p><details><summary>Detalle técnico</summary><pre>${esc(JSON.stringify(r.detalle, null, 2))}</pre></details>`;
    return;
  }
  const v = r.veredicto || {};
  const tipo = v.veredicto || r.veredicto_reglas;
  const senales = (v.senales && v.senales.length ? v.senales : r.senales) || [];
  const conf = typeof v.confianza === "number" ? Math.round(v.confianza * 100) + "%" : "—";
  res.innerHTML = `
    <div class="cabecera"><span class="chip ${tipo}">${ETIQUETA[tipo] || tipo}</span><span class="conf">confianza ${conf} · reglas: ${esc(r.veredicto_reglas)}</span></div>
    <div>
      <h3 class="rotulo">Por qué</h3>
      ${
        senales.length
          ? `<ul class="senales">${senales.map((s) => `<li><b>${esc(NOMBRE_SENAL[s.tipo] || s.tipo)}</b><span>${esc(s.evidencia)}</span></li>`).join("")}</ul>`
          : `<p class="regla">No encontré señales de fraude en este mensaje. Eso no lo vuelve seguro: el banco nunca pide claves ni códigos por mensaje.</p>`
      }
    </div>
    <div>
      <h3 class="rotulo">Qué hacer</h3>
      <div class="accion">${esc(v.accion || "Ante la duda, no toques el enlace y llama al número oficial impreso en tu tarjeta.")}</div>
      ${v.canal_oficial ? `<p class="canal">Canal oficial: ${esc(v.canal_oficial)}</p>` : ""}
    </div>
    <div>
      <h3 class="rotulo">Lo que leyó el modelo de visión</h3>
      <p class="leido"><b>${esc(r.captura.canal)}</b> · de <b>${esc(r.captura.remitente || "remitente no identificado")}</b>\n${esc(r.captura.texto)}</p>
    </div>
    <div class="acciones">
      <button class="sec" id="reportar">Reportar como fraude</button>
      <span class="mini">Solo se comparte el hash del remitente, número o dominio. Nunca el mensaje.</span>
    </div>
    <details><summary>JSON completo</summary><pre>${esc(JSON.stringify({ captura: r.captura, senales: r.senales, veredicto: r.veredicto, tiempos: r.tiempos, modelos: r.modelos }, null, 2))}</pre></details>`;
  tiempos.textContent = `visión: primer token ${r.tiempos.extraccion_ttft_ms ?? "—"} ms, total ${r.tiempos.extraccion_ms} ms · veredicto: primer token ${r.tiempos.veredicto_ttft_ms ?? "—"} ms, total ${r.tiempos.veredicto_ms} ms`;
  const b = $("#reportar");
  if (b)
    b.onclick = async () => {
      b.disabled = true;
      const reps = await window.escudo.reportar(r.captura);
      b.textContent = `Reportado · ${reps.length} indicadores en este equipo`;
      pintaBanco(reps);
    };
}

function pintaHistorial() {
  const h = $("#historial"),
    ul = $("#historialLista");
  if (!sesion.length) {
    h.hidden = true;
    return;
  }
  h.hidden = false;
  ul.innerHTML = sesion
    .map((r, i) => {
      const t = r.ok ? (r.veredicto && r.veredicto.veredicto) || r.veredicto_reglas : "error";
      return `<li data-i="${i}"><span class="chip ${t}">${ETIQUETA[t] || t}</span><span>${esc(r.nombre)}</span></li>`;
    })
    .join("");
  for (const li of ul.querySelectorAll("li")) {
    li.onclick = () => {
      const r = sesion[Number(li.dataset.i)];
      vista.src = `file://${r.ruta}`;
      figura.hidden = false;
      pinta(r);
    };
  }
}

async function analizar(ruta) {
  if (ocupado || !ruta) return;
  vista.src = "file://" + ruta;
  figura.hidden = false;
  res.innerHTML = `<div class="cargando"><span class="spinner"></span><span>Leyendo la captura en este equipo…</span></div>`;
  pon("analizando");
  try {
    const r = await window.escudo.analizar(ruta);
    r.nombre = ruta.split("/").pop();
    sesion.unshift(r);
    pintaHistorial();
    pinta(r);
    pon("listo");
  } catch (e) {
    res.innerHTML = `<div class="cabecera"><span class="chip error">Error</span></div><p class="regla">${esc(e.message || e)}</p>`;
    pon("error");
  }
}

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
          `<tr><td>${new Date(r.ts).toLocaleTimeString("es-PA")}</td><td>${esc(r.tipo)}</td><td>${esc(r.hash)}</td><td>${esc(r.origen)}</td></tr>`,
      )
      .join("") || `<tr><td colspan="4">Todavía no hay reportes.</td></tr>`;
}

async function medirRed() {
  try {
    const r = await window.escudo.red();
    const el = $("#red");
    const n = $("#redNube");
    if (r.nube === null) {
      n.textContent = "n/d";
      return;
    }
    n.textContent = String(r.nube);
    el.classList.toggle("alerta", r.nube > 0);
    el.title = r.detalle.length
      ? r.detalle.map((d) => `${d.proceso} → ${d.destino}${d.local ? " (local)" : ""}`).join("\n")
      : "Sin conexiones TCP establecidas";
  } catch {
    /* */
  }
}

$("#elegir").onclick = async () => analizar(await window.escudo.elegirCaptura());
for (const ev of ["dragenter", "dragover"]) {
  zona.addEventListener(ev, (e) => {
    e.preventDefault();
    zona.classList.add("sobre");
  });
}
for (const ev of ["dragleave", "drop"]) {
  zona.addEventListener(ev, (e) => {
    e.preventDefault();
    zona.classList.remove("sobre");
  });
}
zona.addEventListener("drop", (e) => {
  const f = e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) analizar(window.escudo.rutaDeArchivo(f));
});
document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("drop", (e) => e.preventDefault());
// ---------------------------------------------------------------- modo llamada
const audio = $("#audio");
const alerta = $("#alerta");
let cola = []; // segmentos y alertas pendientes de mostrar, alineados al tiempo del audio
function limpiarLlamada() {
  cola = [];
  $("#transcripcion").innerHTML = "";
  $("#llamadaVacio").hidden = false;
  $("#resumenLlamada").hidden = true;
  alerta.hidden = true;
}
function muestraTranscripcion(item) {
  const ol = $("#transcripcion");
  $("#llamadaVacio").hidden = true;
  const li = document.createElement("li");
  if (item.tipo) {
    li.className = "aviso";
    li.innerHTML = `${ICONO_AVISO} ${esc(item.mensaje)} <span class="t">«${esc(item.frase)}»</span>`;
    alerta.hidden = false;
    $("#alertaTexto").textContent = item.mensaje;
  } else {
    li.innerHTML = `<span class="t">${Math.round(item.t0)}–${Math.round(item.t1)} s</span><span>${esc(item.texto || "…")}</span>`;
  }
  ol.appendChild(li);
  ol.lastElementChild.scrollIntoView({ block: "nearest" });
}
// Los lotes se transcriben más rápido que el tiempo real: se muestran cuando el audio los alcanza, como en vivo.
function vaciarCola() {
  const t = audio.currentTime;
  while (cola.length && (audio.paused || audio.ended || cola[0].t <= t + 0.2)) muestraTranscripcion(cola.shift());
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
    if (cola.length || (!audio.paused && !audio.ended)) return setTimeout(esperar, 400);
    const v = r.resumen || {};
    const el = $("#resumenLlamada");
    el.hidden = false;
    el.innerHTML = `<div class="resumen"><div class="cabecera"><span class="chip ${esc(v.veredicto || "sospechoso")}">${ETIQUETA[v.veredicto] || v.veredicto}</span><span class="conf">${r.alertas.length} avisos · ${Math.round(r.duracion_s)} s de llamada</span></div><p>${esc(v.resumen || "")}</p><div class="accion">${esc(v.accion || "")}</div></div>`;
    tiempos.textContent = `llamada: ${r.segmentos.length} lotes transcritos en este equipo · resumen ${v.ms ?? "—"} ms`;
    pon("listo");
    return undefined;
  };
  esperar();
});
async function simularLlamada(ruta) {
  if (ocupado || !ruta) return;
  limpiarLlamada();
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
$("#llamadaArchivo").onclick = async () => simularLlamada(await window.escudo.elegirAudio());

for (const t of document.querySelectorAll(".tab")) {
  t.onclick = () => {
    for (const x of document.querySelectorAll(".tab")) x.classList.toggle("activa", x === t);
    $("#vistaCliente").hidden = t.dataset.tab !== "cliente";
    $("#vistaLlamada").hidden = t.dataset.tab !== "llamada";
    $("#vistaBanco").hidden = t.dataset.tab !== "banco";
  };
}

(async () => {
  const sel = $("#demoSel");
  for (const c of await window.escudo.capturasDemo()) {
    const o = document.createElement("option");
    o.value = c.ruta;
    o.textContent = c.id;
    sel.appendChild(o);
  }
  $("#demoBtn").onclick = () => analizar(sel.value);
  window.escudo.on("ocupado", (v) => {
    ocupado = v;
    $("#elegir").disabled = v;
    $("#demoBtn").disabled = v;
  });
  window.escudo.on("progreso-modelo", (p) => pon(`cargando ${p.modelo} ${Math.round(p.porcentaje)}%`));
  window.escudo.on("progreso-descarga", (p) => pon(`descargando ${p.modelo} ${Math.round(p.porcentaje)}%`));
  const st = await window.escudo.estado();
  $("#modelos").textContent =
    `VisionPsy Nano 460M Flash · Qwen3 4B · SDK ${st.sdk} · ${st.hardware.cpu}, ${st.hardware.ram_gb} GB · inferencia local`;
  pintaBanco(st.reportes || []);
  medirRed();
  setInterval(medirRed, 3000);
  const auto = await window.escudo.demoAuto();
  if (auto?.captura) analizar(auto.captura);
  if (auto?.llamada) {
    document.querySelector('[data-tab="llamada"]').click();
    simularLlamada(auto.llamada);
  }
})();
