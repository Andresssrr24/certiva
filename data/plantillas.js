// Tres plantillas visuales que imitan cómo se ve un mensaje en un teléfono: SMS, WhatsApp y correo.
// Sin logos ni marcas reales. Se renderizan a 390x844 px CSS y se capturan al doble de escala.
"use strict";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function conEnlaces(texto) {
  return esc(texto).replace(
    /(https?:\/\/[^\s]+|[a-z0-9.-]+\.(?:com|net|app|info|co|pa|link|ly|gd|gy|io)(?:\.[a-z]{2})?(?:\/[^\s]*)?)/gi,
    (m) => `<span class="lnk">${m}</span>`,
  );
}
const base = (cuerpo, extraCss = "") => `<!doctype html><html lang="es"><head><meta charset="utf-8">
<style>
  html,body{margin:0;width:390px;height:844px;overflow:hidden;font-family:-apple-system,"SF Pro Text","Helvetica Neue",Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased}
  .status{height:44px;display:flex;justify-content:space-between;align-items:center;padding:0 22px;font-size:15px;font-weight:600}
  .lnk{text-decoration:underline}
  ${extraCss}
</style></head><body>${cuerpo}</body></html>`;

function sms(m) {
  const hora = m.hora || "10:24";
  return base(
    `
  <div class="wrap">
    <div class="status"><span>${hora}</span><span>▲ ▮ 82%</span></div>
    <div class="hdr"><div class="back">‹</div><div class="avatar">${esc((m.remitente || "?").slice(0, 1))}</div><div class="who">${esc(m.remitente)}</div></div>
    <div class="chat">
      <div class="stamp">Mensaje de texto · hoy ${hora}</div>
      <div class="bubble">${conEnlaces(m.texto)}</div>
    </div>
    <div class="input"><span>Mensaje de texto</span></div>
  </div>`,
    `
  .wrap{background:#fff;height:100%;display:flex;flex-direction:column;color:#000}
  .hdr{display:flex;flex-direction:column;align-items:center;padding:4px 0 10px;border-bottom:1px solid #e5e5ea;position:relative}
  .back{position:absolute;left:16px;top:4px;font-size:30px;color:#0a84ff}
  .avatar{width:48px;height:48px;border-radius:50%;background:#8e8e93;color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:600}
  .who{font-size:12px;margin-top:6px;color:#000}
  .chat{flex:1;padding:14px 16px}
  .stamp{text-align:center;font-size:12px;color:#8e8e93;margin-bottom:10px}
  .bubble{max-width:280px;background:#e9e9eb;border-radius:18px;padding:10px 14px;font-size:17px;line-height:1.35;white-space:pre-wrap;word-wrap:break-word}
  .bubble .lnk{color:#0a84ff}
  .input{height:60px;border-top:1px solid #e5e5ea;display:flex;align-items:center;padding:0 16px;color:#8e8e93;font-size:17px}
  .input span{border:1px solid #c7c7cc;border-radius:20px;padding:8px 14px;flex:1}`,
  );
}

function whatsapp(m) {
  const hora = m.hora || "9:12";
  const verificado = m.verificado ? ' <span class="ok">✔</span>' : "";
  return base(
    `
  <div class="wrap">
    <div class="status top"><span>${hora}</span><span>▲ ▮ 82%</span></div>
    <div class="hdr"><span class="back">‹</span><div class="av">${esc((m.remitente || "?").slice(0, 1))}</div><div class="name">${esc(m.remitente)}${verificado}<div class="sub">${m.verificado ? "Cuenta de empresa verificada" : "No está en tus contactos"}</div></div></div>
    <div class="chat">
      ${m.verificado ? "" : '<div class="warn">Este número no está en tus contactos. Ten cuidado con los mensajes de desconocidos.</div>'}
      <div class="bubble">${conEnlaces(m.texto)}<span class="time">${hora}</span></div>
    </div>
    <div class="input"><span>Mensaje</span></div>
  </div>`,
    `
  .wrap{background:#efe7dd;height:100%;display:flex;flex-direction:column;color:#111}
  .top{background:#075e54;color:#fff}
  .hdr{background:#075e54;color:#fff;display:flex;align-items:center;gap:10px;padding:6px 12px 10px}
  .back{font-size:28px}
  .av{width:40px;height:40px;border-radius:50%;background:#cfd8dc;color:#455a64;display:flex;align-items:center;justify-content:center;font-weight:600}
  .name{font-size:16px;font-weight:600;line-height:1.1}
  .sub{font-size:12px;font-weight:400;opacity:.85;margin-top:2px}
  .ok{color:#25d366;font-size:14px}
  .chat{flex:1;padding:12px 10px}
  .warn{background:#fff7d6;color:#5a4b00;font-size:12px;border-radius:8px;padding:8px 10px;margin:0 20px 12px;text-align:center}
  .bubble{position:relative;max-width:290px;background:#fff;border-radius:10px;padding:8px 12px 18px;font-size:16px;line-height:1.35;white-space:pre-wrap;word-wrap:break-word;box-shadow:0 1px 0 rgba(0,0,0,.08)}
  .bubble .lnk{color:#027eb5}
  .time{position:absolute;right:10px;bottom:4px;font-size:11px;color:#8a8a8a}
  .input{height:60px;display:flex;align-items:center;padding:0 12px;color:#8a8a8a;font-size:16px}
  .input span{background:#fff;border-radius:22px;padding:10px 16px;flex:1}`,
  );
}

function correo(m) {
  return base(
    `
  <div class="wrap">
    <div class="status"><span>${m.hora || "8:03"}</span><span>▲ ▮ 82%</span></div>
    <div class="bar"><span>‹</span><span>⋮</span></div>
    <div class="subject">${esc(m.asunto || "")}</div>
    <div class="from"><div class="av">${esc((m.remitenteNombre || m.remitente || "?").slice(0, 1))}</div>
      <div><div class="fn">${esc(m.remitenteNombre || "")} <span class="addr">&lt;${esc(m.remitente)}&gt;</span></div><div class="to">para mí · ${m.fecha || "hoy"}</div></div></div>
    <div class="body">${conEnlaces(m.texto).replace(/\n/g, "<br>")}</div>
  </div>`,
    `
  .wrap{background:#fff;height:100%;color:#202124}
  .bar{display:flex;justify-content:space-between;padding:8px 18px;font-size:26px;color:#5f6368}
  .subject{font-size:22px;font-weight:500;padding:6px 20px 12px;line-height:1.25}
  .from{display:flex;gap:12px;align-items:center;padding:0 20px 14px}
  .av{width:40px;height:40px;border-radius:50%;background:#7b1fa2;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600}
  .fn{font-size:15px;font-weight:500}
  .addr{font-weight:400;color:#5f6368;font-size:13px}
  .to{font-size:13px;color:#5f6368;margin-top:2px}
  .body{padding:4px 20px;font-size:16px;line-height:1.45;white-space:normal;word-wrap:break-word}
  .body .lnk{color:#1a73e8}`,
  );
}

module.exports = { sms, whatsapp, correo };
