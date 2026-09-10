// Interfaz mínima: una captura entra, sale un veredicto con razones. Sin lógica de modelos aquí.
"use strict";
const $ = (s) => document.querySelector(s);
const zona = $("#zona"), vista = $("#vista"), res = $("#resultado"), estado = $("#estado"), tiempos = $("#tiempos");
let ocupado = false;

function pon(txt) { estado.textContent = txt; }
function esc(s) { return String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }

const ETIQUETA = { fraude: "Fraude", sospechoso: "Sospechoso", sin_senales: "Sin señales", no_legible: "No pude leerlo" };

function pinta(r) {
  if (!r.ok) {
    res.innerHTML = `<span class="chip no_legible">No pude leerlo</span><p class="regla">La captura no se pudo interpretar. Prueba con una imagen más nítida. Ante la duda, llama al número oficial impreso en tu tarjeta.</p><details><summary>Detalle</summary><pre>${esc(JSON.stringify(r.detalle, null, 2))}</pre></details>`;
    return;
  }
  const v = r.veredicto || {};
  const tipo = v.veredicto || r.veredicto_reglas;
  const senales = (v.senales && v.senales.length ? v.senales : r.senales) || [];
  res.innerHTML = `
    <div><span class="chip ${tipo}">${ETIQUETA[tipo] || tipo}</span><span class="conf">confianza ${typeof v.confianza === "number" ? Math.round(v.confianza * 100) + "%" : "—"} · reglas: ${esc(r.veredicto_reglas)}</span></div>
    <h3>Por qué</h3>
    ${senales.length ? `<ul class="senales">${senales.map((s) => `<li><b>${esc(s.tipo)}</b> · ${esc(s.evidencia)}</li>`).join("")}</ul>` : `<p class="regla">No encontré señales de fraude en este mensaje. Eso no lo vuelve seguro: el banco nunca pide claves ni códigos.</p>`}
    <h3>Qué hacer</h3>
    <div class="accion">${esc(v.accion || "Ante la duda, no toques el enlace y llama al número oficial impreso en tu tarjeta.")}</div>
    <p class="canal">Canal oficial: ${esc(v.canal_oficial || "")}</p>
    <h3>Lo que leyó el modelo</h3>
    <p><b>${esc(r.captura.canal)}</b> · de <b>${esc(r.captura.remitente)}</b><br>${esc(r.captura.texto)}</p>
    <button class="sec reportar" id="reportar">Reportar como fraude (solo se comparte el indicador)</button>
    <details><summary>JSON completo</summary><pre>${esc(JSON.stringify({ captura: r.captura, senales: r.senales, veredicto: r.veredicto, tiempos: r.tiempos, modelos: r.modelos }, null, 2))}</pre></details>`;
  tiempos.textContent = `TTFT visión ${r.tiempos.extraccion_ttft_ms ?? "—"} ms · extracción ${r.tiempos.extraccion_ms} ms · TTFT texto ${r.tiempos.veredicto_ttft_ms ?? "—"} ms · veredicto ${r.tiempos.veredicto_ms} ms`;
  const b = $("#reportar");
  if (b) b.onclick = async () => { b.disabled = true; const reps = await window.escudo.reportar(r.captura); b.textContent = `Reportado · ${reps.length} indicadores en este equipo`; };
}

async function analizar(ruta) {
  if (ocupado || !ruta) return;
  vista.src = "file://" + ruta; vista.hidden = false;
  res.innerHTML = `<div class="vacio">Leyendo la captura en este equipo…</div>`;
  pon("analizando");
  try { pinta(await window.escudo.analizar(ruta)); pon("listo"); }
  catch (e) { res.innerHTML = `<span class="chip no_legible">Error</span><p class="regla">${esc(e.message || e)}</p>`; pon("error"); }
}

$("#elegir").onclick = async () => analizar(await window.escudo.elegirCaptura());
["dragenter", "dragover"].forEach((ev) => zona.addEventListener(ev, (e) => { e.preventDefault(); zona.classList.add("sobre"); }));
["dragleave", "drop"].forEach((ev) => zona.addEventListener(ev, (e) => { e.preventDefault(); zona.classList.remove("sobre"); }));
zona.addEventListener("drop", (e) => { const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) analizar(window.escudo.rutaDeArchivo(f)); });
document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("drop", (e) => e.preventDefault());

(async () => {
  const sel = $("#demoSel");
  for (const c of await window.escudo.capturasDemo()) { const o = document.createElement("option"); o.value = c.ruta; o.textContent = c.id; sel.appendChild(o); }
  $("#demoBtn").onclick = () => analizar(sel.value);
  window.escudo.on("ocupado", (v) => { ocupado = v; $("#elegir").disabled = v; $("#demoBtn").disabled = v; });
  window.escudo.on("progreso-modelo", (p) => pon(`cargando ${p.modelo} ${Math.round(p.porcentaje)}%`));
  window.escudo.on("progreso-descarga", (p) => pon(`descargando ${p.modelo} ${Math.round(p.porcentaje)}%`));
  const st = await window.escudo.estado();
  $("#modelos").textContent = `VisionPsy Nano 460M Flash · Qwen3 4B · SDK ${st.sdk} · ${st.hardware.cpu}, ${st.hardware.ram_gb} GB`;
})();
