// Sistema visual de Certiva en el teléfono. Los colores, radios y la letra son los mismos del escritorio
// (renderer/certiva.css) y de la lámina de marca aprobada: azul #205094 sobre fondos claros.
"use strict";

const C = {
  marca: "#205094",
  marcaHonda: "#17406f",
  marcaSuave: "#eaf1fb",
  marcaBorde: "#cddffa",
  fondo: "#f4f7fc",
  panel: "#ffffff",
  panel2: "#f2f6fc",
  tinta: "#152e4e",
  gris: "#54677e",
  grisClaro: "#8496ab",
  linea: "#dce5f1",
  malo: "#a3302a",
  maloSuave: "#fceae8",
  maloBorde: "#f3ccc7",
  aviso: "#895909",
  avisoSuave: "#fff3d9",
  avisoBorde: "#f2dfb4",
  neutro: "#526477",
  neutroSuave: "#edf1f5",
  blanco: "#ffffff",
};

// Cada veredicto tiene un color y un icono. «Sin señales» va en azul, no en verde: no encontrar señales no
// vuelve seguro un mensaje, y el verde lo diría. Es la misma decisión del escritorio.
const VEREDICTO = {
  fraude: { color: C.malo, fondo: C.maloSuave, borde: C.maloBorde, icono: "alerta" },
  sospechoso: { color: C.aviso, fondo: C.avisoSuave, borde: C.avisoBorde, icono: "info" },
  sin_senales: { color: C.marca, fondo: C.marcaSuave, borde: C.marcaBorde, icono: "check" },
  no_legible: { color: C.neutro, fondo: C.neutroSuave, borde: C.linea, icono: "ojo" },
};

const estiloVeredicto = (v) => VEREDICTO[v] || VEREDICTO.no_legible;

const R = { ch: 10, s: 14, m: 18, g: 24, pastilla: 999 };

const E = { xs: 4, s: 8, m: 12, g: 16, gg: 20, xl: 26, xxl: 34 };

const SOMBRA = {
  panel: {
    shadowColor: "#0f2f5c",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  flotante: {
    shadowColor: "#0f2f5c",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -2 },
    elevation: 12,
  },
};

module.exports = { C, VEREDICTO, estiloVeredicto, R, E, SOMBRA };
