// Modo llamada: transcripción local por lotes con Parakeet y reglas en vivo sobre la ventana reciente.
// El audio nunca sale del equipo. Las alertas salen de reglas deterministas al instante; Qwen3 solo resume al final.
"use strict";
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const modelos = require("./modelos");
const perf = require("./perf");
const { ESQUEMA_LLAMADA, promptLlamada } = require("./esquemas");

const SR = 16000;

// Reglas de la llamada. Cada una trae el mensaje que ve el cliente, listo para mostrar sin esperar al modelo.
const REGLAS = [
  {
    tipo: "pide_codigo",
    // Cruza puntos y lotes: "un código de seis dígitos. Dígamelo por favor" llega partido en dos transcripciones.
    re: /(c[oó]digo|seis d[ií]gitos|n[uú]meros que le llegaron)[\s\S]{0,140}(d[ií]gamelo|l[eé]amelo|d[ií]ctemelo|me lo (?:lee|dice|dicta|lea|diga)|d[ií]game|l[eé]ame|dicte|deme|env[ií]emelo)|(d[ií]game|l[eé]ame|dicte|deme|env[ií]eme|confirme|ind[ií]queme|necesito)[\s\S]{0,60}(c[oó]digo|seis d[ií]gitos)/i,
    mensaje: "Te están pidiendo el código que te llegó por SMS. El banco nunca lo pide. Cuelga.",
  },
  {
    tipo: "pide_clave",
    re: /(clave|contrase[ñn]a|pin|usuario)[^.]{0,50}(banca en l[ií]nea|confirme|d[ií]game|necesito)|(confirme|d[ií]game|necesito)[^.]{0,50}(clave|contrase[ñn]a|pin)/i,
    mensaje: "Te están pidiendo tu clave. Ningún funcionario del banco la necesita. Cuelga.",
  },
  {
    tipo: "urgencia",
    re: /ahora mismo|en este momento|en dos minutos|de inmediato|tiene que ser ya|antes de que|se va a aprobar|lo aprueba/i,
    mensaje: "Te están presionando con el tiempo. Eso es una táctica de estafa. Cuelga y llama al número oficial.",
  },
  {
    tipo: "suplantacion",
    re: /le habla[^.]{0,40}(departamento|seguridad|banco)|del (departamento|área) de (seguridad|fraude|tarjetas)|de banco/i,
    mensaje: "Dice ser del banco. El banco no llama para pedir datos: si dudas, cuelga y llama tú al número oficial.",
  },
  {
    tipo: "pago_terceros",
    re: /transfiera|transferencia|yappy|dep[oó]site|pague a/i,
    mensaje: "Te piden mover dinero. El banco nunca pide transferencias por teléfono. Cuelga.",
  },
];

function pcmDeWav(ruta) {
  const b = fs.readFileSync(ruta);
  let i = 12;
  let sr = SR;
  let canales = 1;
  let bits = 16;
  while (i < b.length - 8) {
    const id = b.toString("ascii", i, i + 4);
    const tam = b.readUInt32LE(i + 4);
    if (id === "fmt ") {
      canales = b.readUInt16LE(i + 10);
      sr = b.readUInt32LE(i + 12);
      bits = b.readUInt16LE(i + 22);
    }
    if (id === "data") return { pcm: b.subarray(i + 8, i + 8 + tam), sr, canales, bits };
    i += 8 + tam + (tam % 2);
  }
  throw new Error("WAV sin chunk data");
}
function cabeceraWav(bytes) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + bytes, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(bytes, 40);
  return h;
}
// Cualquier audio se lleva a 16 kHz mono 16 bits con afconvert (macOS). Si ya está así, se usa tal cual.
function normalizar(ruta) {
  try {
    const w = pcmDeWav(ruta);
    if (w.sr === SR && w.canales === 1 && w.bits === 16) return ruta;
  } catch {
    /* no es WAV */
  }
  const salida = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "llamada-")), "audio.wav");
  execFileSync("afconvert", ["-f", "WAVE", "-d", "LEI16@16000", "-c", "1", ruta, salida]);
  return salida;
}

function evaluarLlamada(textoVentana, yaVistas) {
  const nuevas = [];
  for (const r of REGLAS) {
    if (yaVistas.has(r.tipo)) continue;
    const m = r.re.exec(textoVentana);
    if (m) {
      yaVistas.add(r.tipo);
      nuevas.push({ tipo: r.tipo, frase: m[0].trim().slice(0, 120), mensaje: r.mensaje });
    }
  }
  return nuevas;
}

class Llamada {
  constructor({ motor }) {
    this.motor = motor;
    this.vozId = null;
    this.detener = false;
  }

  async cargarVoz() {
    if (this.vozId) return this.vozId;
    const e = modelos.entrada("voz", modelos.DEFECTOS.voz);
    const S = await modelos.sdk();
    const t0 = Date.now();
    this.vozId = await S.loadModel(await modelos.argsCarga(e));
    perf.registrar({ modelo: e.label, constante: e.constName, tarea: "carga", carga_modelo_ms: Date.now() - t0 });
    return this.vozId;
  }

  // Procesa un archivo por lotes de `ventanaS` segundos. Llama onSegmento({t0,t1,texto,ms}) y onAlerta({tipo,frase,mensaje,t}).
  async procesarArchivo(rutaAudio, { ventanaS = 5, contextoS = 20, onSegmento, onAlerta } = {}) {
    await this.cargarVoz();
    const S = await modelos.sdk();
    const { pcm } = pcmDeWav(normalizar(rutaAudio));
    const bytesPorS = SR * 2;
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "llamada-lotes-"));
    const segmentos = [];
    const vistas = new Set();
    const alertas = [];
    this.detener = false;
    const total = pcm.length / bytesPorS;
    for (let t = 0; t < total && !this.detener; t += ventanaS) {
      const ini = Math.floor(t * bytesPorS),
        fin = Math.min(pcm.length, Math.floor((t + ventanaS) * bytesPorS));
      const trozo = pcm.subarray(ini, fin);
      const ruta = path.join(tmp, `lote-${String(Math.round(t)).padStart(4, "0")}.wav`);
      fs.writeFileSync(ruta, Buffer.concat([cabeceraWav(trozo.length), trozo]));
      const t0 = Date.now();
      let texto = "";
      try {
        texto = String(await S.transcribe({ modelId: this.vozId, audioChunk: ruta })).trim();
      } catch (e) {
        texto = "";
        perf.registrar({
          modelo: "Parakeet TDT 0.6B v3",
          tarea: "transcripcion_lote",
          error: String(e.message || e).slice(0, 120),
        });
      }
      const ms = Date.now() - t0;
      perf.registrar({
        modelo: "Parakeet TDT 0.6B v3",
        tarea: "transcripcion_lote",
        total_ms: ms,
        audio_s: (fin - ini) / bytesPorS,
      });
      const seg = { t0: t, t1: Math.min(total, t + ventanaS), texto, ms };
      segmentos.push(seg);
      if (onSegmento) onSegmento(seg);
      const ventana = segmentos
        .filter((s) => s.t1 > seg.t1 - contextoS)
        .map((s) => s.texto)
        .join(" ");
      for (const a of evaluarLlamada(ventana, vistas)) {
        const al = { ...a, t: seg.t1 };
        alertas.push(al);
        if (onAlerta) onAlerta(al);
      }
    }
    return {
      segmentos,
      alertas,
      transcripcion: segmentos
        .map((s) => s.texto)
        .join(" ")
        .trim(),
      duracion_s: total,
    };
  }

  // Resumen final con Qwen3: dos frases y qué hacer. Reutiliza el modelo de texto del motor.
  async resumir({ transcripcion, alertas }) {
    await this.motor.cargarTexto();
    const e = modelos.entrada("texto", this.motor.textoKey);
    let politica = [];
    if (this.motor.usarPolitica) {
      try {
        politica = (
          await this.motor.politica.buscar(
            `llamada ${alertas.map((a) => a.tipo.replace(/_/g, " ")).join(" ")} ${transcripcion.slice(0, 200)}`,
            3,
          )
        ).map((f) => f.texto);
      } catch {
        politica = [];
      }
    }
    const r = await this.motor._completar({
      modelId: this.motor.textoId,
      esquema: ESQUEMA_LLAMADA,
      nombre: "llamada",
      etiqueta: e.label,
      tarea: "resumen_llamada",
      history: promptLlamada({
        transcripcion: transcripcion.slice(0, 2000),
        alertas: alertas.map((a) => ({ tipo: a.tipo, frase: a.frase })),
        banco: this.motor.banco,
        politica,
      }),
    });
    let v = null;
    try {
      v = JSON.parse(r.texto.trim());
    } catch {
      v = null;
    }
    if (!v)
      v = {
        veredicto: alertas.length ? "fraude" : "sin_senales",
        resumen: "No pude resumir la llamada.",
        accion: "Ante la duda, cuelga y llama al número oficial de tu tarjeta.",
      };
    return { ...v, ms: r.total };
  }

  async descargar() {
    if (!this.vozId) return;
    const S = await modelos.sdk();
    try {
      await S.unloadModel({ modelId: this.vozId, clearStorage: false });
    } catch {
      /* */
    }
    this.vozId = null;
  }
}

module.exports = { Llamada, evaluarLlamada, REGLAS };
