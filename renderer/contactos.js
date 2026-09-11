/* UI del directorio publicado, independiente de la extracción del mensaje. */
(() => {
  "use strict";
  const { directorio, comparar, fuentePorId } = window.CertivaContactos;
  const fecha = new Date(`${directorio.consultadoEl}T12:00:00Z`).toLocaleDateString("es-PA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Panama",
  });
  function crear(etiqueta, clase, texto) {
    const nodo = document.createElement(etiqueta);
    nodo.className = clase;
    if (texto) nodo.textContent = texto;
    return nodo;
  }
  for (const [botonId, panelId] of [
    ["tLlamar", "tContacto"],
    ["tLlamar2", "tContacto2"],
  ]) {
    const boton = document.getElementById(botonId),
      panel = document.getElementById(panelId);
    if (!boton || !panel) continue;
    panel.className = "contactos-banco";
    panel.setAttribute("aria-label", `Contactos publicados de ${directorio.banco}`);
    panel.append(crear("span", "contactos-sello", `${directorio.consulta} · ${fecha}`));
    panel.append(crear("h3", "contactos-titulo", `Contactos de ${directorio.banco}`));
    panel.append(
      crear("p", "contactos-intro", "Números publicados en el sitio del banco para comunicarte por tu cuenta."),
    );
    const contexto = crear("p", "contactos-contexto");
    contexto.hidden = true;
    panel.append(contexto);
    for (const contacto of directorio.contactos) {
      const tarjeta = crear("article", "contacto-card");
      tarjeta.append(crear("span", "contacto-canal", contacto.canal));
      tarjeta.append(crear("h4", "contacto-uso", contacto.titulo));
      tarjeta.append(crear("strong", "contacto-numero", contacto.numero));
      tarjeta.append(crear("p", "contacto-descripcion", contacto.uso));
      const fuentes = crear("div", "contacto-fuentes");
      fuentes.append(crear("span", "", "Fuente: "));
      for (const id of contacto.fuentes) {
        const fuente = fuentePorId(id);
        const enlace = crear("a", "contacto-fuente", fuente.titulo);
        enlace.href = fuente.url;
        enlace.target = "_blank";
        enlace.rel = "noopener noreferrer";
        enlace.addEventListener("click", async (event) => {
          if (!window.escudo?.abrirFuenteContacto) return;
          event.preventDefault();
          try {
            await window.escudo.abrirFuenteContacto(id);
          } catch {
            estado.textContent = "No se pudo abrir la fuente. Visita cajadeahorros.com.pa para consultar sus canales.";
          }
        });
        fuentes.append(enlace);
      }
      tarjeta.append(fuentes);
      panel.append(tarjeta);
    }
    const form = crear("form", "contacto-comparador");
    const label = crear("label", "", "¿Quieres comparar un número?");
    label.htmlFor = `${panelId}-numero`;
    const entrada = crear("input", "");
    entrada.id = label.htmlFor;
    entrada.type = "tel";
    entrada.placeholder = "+507 0000-0000";
    entrada.autocomplete = "off";
    entrada.maxLength = 25;
    const compararBtn = crear("button", "", "Comparar con este directorio");
    compararBtn.type = "submit";
    const estado = crear("p", "contacto-estado");
    estado.setAttribute("role", "status");
    form.append(label, entrada, compararBtn, estado);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const resultado = comparar(entrada.value);
      estado.dataset.estado = resultado.estado;
      estado.textContent =
        resultado.estado === "coincide"
          ? `Coincide con ${resultado.contacto.numero} (${resultado.contacto.titulo}). Esto no confirma quién te llama: el identificador puede ser suplantado. Inicia tú el contacto por el canal publicado.`
          : resultado.estado === "invalido"
            ? "Escribe un número de Panamá de 7 u 8 dígitos, con o sin +507."
            : "No aparece en este directorio consultado. La lista no incluye necesariamente todos los números del banco; esta ausencia no prueba fraude. Verifica por un canal publicado.";
    });
    panel.append(form);
    panel.append(
      crear(
        "p",
        "contactos-nota",
        "Consulta web guardada en la fecha indicada; no se busca en Internet al analizar cada mensaje. Abre la fuente para comprobar actualizaciones. Los números coincidentes no autentican llamadas ni mensajes.",
      ),
    );
    boton.textContent = "Ver números oficiales y fuentes";
    boton.setAttribute("aria-controls", panelId);
    boton.setAttribute("aria-expanded", "false");
    boton.onclick = () => {
      panel.hidden = !panel.hidden;
      boton.setAttribute("aria-expanded", String(!panel.hidden));
      if (!panel.hidden) panel.scrollIntoView({ block: "start", behavior: "instant" });
    };
    window.escudo
      ?.estado()
      .then((st) => {
        if (st.banco?.nombre && st.banco.nombre !== directorio.banco) {
          contexto.textContent = `El ejemplo se analiza con ${st.banco.nombre}. Este directorio corresponde a ${directorio.banco}; no identifica al banco del mensaje.`;
          contexto.hidden = false;
        }
      })
      .catch(() => {});
  }
})();
