// Genera el audio sintético de la llamada de vishing con las voces del sistema (macOS `say`), sin grabar a nadie.
// Salida: data/audio/llamada-vishing.wav, 16 kHz mono 16 bits, con pausas entre turnos.
// Uso: node data/generar-llamada.js   (requiere macOS; en otro sistema, grabar el guion de data/llamada-vishing.md)
"use strict";
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const TURNOS = [
  [
    "Eddy (Español (México))",
    "Buenos días, ¿hablo con la señora Ana? Le habla Carlos Pérez del departamento de seguridad de Banco Demo. Estamos viendo un intento de compra por cuatrocientos ochenta dólares desde otro país con su tarjeta. ¿Usted autorizó esa compra?",
  ],
  ["Grandma (Español (México))", "No, yo no he comprado nada."],
  [
    "Eddy (Español (México))",
    "Tranquila, para eso la estoy llamando. Vamos a bloquear la transacción ahora mismo. Le acaba de llegar un mensaje de texto con un código de seis dígitos. Dígamelo por favor para confirmar que es usted y cancelar el cargo. Tiene que ser en este momento, porque en dos minutos el sistema lo aprueba.",
  ],
  ["Grandma (Español (México))", "Me llegó un código. ¿Se lo leo?"],
  [
    "Eddy (Español (México))",
    "Sí, léamelo completo. Y después necesito que me confirme su clave de banca en línea para dejar la cuenta protegida.",
  ],
];
const PAUSA_S = 0.8;
const SR = 16000;

function wavPcm(ruta) {
  const b = fs.readFileSync(ruta);
  // Busca el chunk "data" del WAV (afconvert escribe cabecera estándar)
  let i = 12;
  while (i < b.length - 8) {
    const id = b.toString("ascii", i, i + 4);
    const tam = b.readUInt32LE(i + 4);
    if (id === "data") return b.subarray(i + 8, i + 8 + tam);
    i += 8 + tam + (tam % 2);
  }
  throw new Error("WAV sin chunk data: " + ruta);
}
function cabeceraWav(bytesPcm) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + bytesPcm, 4);
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
  h.writeUInt32LE(bytesPcm, 40);
  return h;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "llamada-"));
const partes = [];
const silencio = Buffer.alloc(Math.round(PAUSA_S * SR) * 2);
TURNOS.forEach(([voz, texto], i) => {
  const aiff = path.join(tmp, `t${i}.aiff`),
    wav = path.join(tmp, `t${i}.wav`);
  execFileSync("say", ["-v", voz, "-r", "175", "-o", aiff, texto]);
  execFileSync("afconvert", ["-f", "WAVE", "-d", "LEI16@16000", "-c", "1", aiff, wav]);
  partes.push(wavPcm(wav), silencio);
});
const pcm = Buffer.concat(partes);
const salida = path.join(__dirname, "audio", "llamada-vishing.wav");
fs.writeFileSync(salida, Buffer.concat([cabeceraWav(pcm.length), pcm]));
console.log(`Audio listo: ${salida} · ${(pcm.length / 2 / SR).toFixed(1)} s · ${TURNOS.length} turnos`);
