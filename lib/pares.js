// Capa de pares. Corre en un proceso hijo (scripts/pares-worker.js) para que sus conexiones se cuenten aparte
// de las del motor: la app puede decir «a la nube: 0 · a pares: N» y demostrarlo con lsof.
// Protocolo: líneas JSON. Solo viajan hashes de indicadores, tipo, hora y el id anónimo del nodo. Nunca el mensaje.
"use strict";
const crypto = require("node:crypto");
const net = require("node:net");

const TEMA = crypto.createHash("sha256").update("antifraude-qvac/indicadores/v1").digest();

class Pares {
  constructor({ nodo, onIndicador, onEstado, onLog } = {}) {
    this.nodo = nodo || crypto.randomBytes(6).toString("hex");
    this.conexiones = new Set();
    this.conocidos = new Map(); // hash -> { tipo, hash, primero_ts, nodos:Set, cuenta }
    this.onIndicador = onIndicador || (() => {});
    this.onEstado = onEstado || (() => {});
    this.onLog = onLog || (() => {});
    this.swarm = null;
    this.servidor = null;
  }

  estado() { return { nodo: this.nodo, pares: this.conexiones.size, indicadores: this.conocidos.size }; }

  // Registra un indicador visto (propio o ajeno) y devuelve si era nuevo para ese nodo.
  registrar(ind, origen) {
    const clave = `${ind.tipo}:${ind.hash}`;
    let e = this.conocidos.get(clave);
    if (!e) { e = { tipo: ind.tipo, hash: ind.hash, primero_ts: ind.ts || Date.now(), nodos: new Set(), cuenta: 0 }; this.conocidos.set(clave, e); }
    if (e.nodos.has(origen)) return false;
    e.nodos.add(origen); e.cuenta = e.nodos.size;
    return true;
  }

  vecinos(ind) { const e = this.conocidos.get(`${ind.tipo}:${ind.hash}`); return e ? [...e.nodos].filter((n) => n !== this.nodo).length : 0; }

  // Publica un indicador propio a todos los pares conectados.
  publicar(ind) {
    const msg = { v: 1, tipo: "indicador", nodo: this.nodo, ind: { tipo: ind.tipo, hash: ind.hash, ts: ind.ts || Date.now() } };
    this.registrar(msg.ind, this.nodo);
    for (const c of this.conexiones) this._enviar(c, msg);
  }

  _enviar(conn, obj) { try { conn.write(`${JSON.stringify(obj)}\n`); } catch { /* */ } }

  _atender(conn, etiqueta) {
    this.conexiones.add(conn);
    this.onEstado(this.estado());
    this.onLog(`par conectado (${etiqueta})`);
    // Al conectar, cada lado manda lo que ya conoce, así el radar nuevo se pone al día.
    const lote = [...this.conocidos.values()].map((e) => ({ tipo: e.tipo, hash: e.hash, ts: e.primero_ts, nodos: [...e.nodos] }));
    this._enviar(conn, { v: 1, tipo: "hola", nodo: this.nodo });
    if (lote.length) this._enviar(conn, { v: 1, tipo: "lote", nodo: this.nodo, inds: lote });
    let buf = "";
    conn.on("data", (d) => {
      buf += d.toString("utf8");
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const linea = buf.slice(0, i); buf = buf.slice(i + 1);
        if (!linea.trim()) continue;
        let m; try { m = JSON.parse(linea); } catch { continue; }
        this._mensaje(m);
      }
    });
    const cerrar = () => { this.conexiones.delete(conn); this.onEstado(this.estado()); this.onLog(`par desconectado (${etiqueta})`); };
    conn.on("close", cerrar); conn.on("error", cerrar);
  }

  _mensaje(m) {
    if (!m || m.v !== 1 || !m.nodo || m.nodo === this.nodo) return;
    if (m.tipo === "indicador" && m.ind && m.ind.hash) {
      if (this.registrar(m.ind, m.nodo)) this.onIndicador({ ...m.ind, nodo: m.nodo, vecinos: this.vecinos(m.ind) });
    } else if (m.tipo === "lote" && Array.isArray(m.inds)) {
      for (const ind of m.inds.slice(0, 5000)) {
        if (!ind || !ind.hash) continue;
        let nuevo = false;
        for (const n of Array.isArray(ind.nodos) && ind.nodos.length ? ind.nodos : [m.nodo]) if (n !== this.nodo && this.registrar(ind, n)) nuevo = true;
        if (nuevo) this.onIndicador({ tipo: ind.tipo, hash: ind.hash, ts: ind.ts, nodo: m.nodo, vecinos: this.vecinos(ind) });
      }
    }
  }

  // Hyperswarm: encuentra pares por el tema, a través del DHT. Si la red del venue lo bloquea, queda el modo directo.
  async iniciarSwarm() {
    const Hyperswarm = require("hyperswarm");
    this.swarm = new Hyperswarm();
    this.swarm.on("connection", (conn, info) => this._atender(conn, `swarm ${info && info.publicKey ? info.publicKey.toString("hex").slice(0, 8) : ""}`));
    this.swarm.join(TEMA, { server: true, client: true });
    this.swarm.flush().then(() => this.onLog("swarm: anunciado en el DHT")).catch((e) => this.onLog(`swarm: ${e.message}`));
  }

  // Modo directo por TCP en la misma red: escucha en un puerto y/o se conecta a host:puerto.
  escucharDirecto(puerto) {
    this.servidor = net.createServer((sock) => this._atender(sock, `directo ${sock.remoteAddress}`));
    this.servidor.on("error", (e) => this.onLog(`directo: ${e.message}`));
    this.servidor.listen(puerto, () => this.onLog(`directo: escuchando en ${puerto}`));
  }
  conectarDirecto(destino) {
    const [host, puerto] = destino.split(":");
    const intentar = () => {
      const sock = net.connect(Number(puerto), host, () => this._atender(sock, `directo ${destino}`));
      sock.on("error", () => setTimeout(intentar, 5000));
    };
    intentar();
  }

  async cerrar() {
    for (const c of this.conexiones) { try { c.destroy(); } catch { /* */ } }
    if (this.servidor) { try { this.servidor.close(); } catch { /* */ } }
    if (this.swarm) { try { await this.swarm.destroy(); } catch { /* */ } }
  }
}

module.exports = { Pares, TEMA };
