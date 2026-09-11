// Explicit integration check: uses real local QVAC models, never a test double.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { cpus, totalmem, platform, arch } from 'node:os';
import { createBridge, unloadQvac } from './bridge.mjs';
import { EXAMPLES } from '../public/analyzer.js';
const { server, token } = createBridge();
const evidence = { timestamp:new Date().toISOString(), integration:'HTTP bridge + real @qvac/sdk 0.19.0', hardware:{ cpu:cpus()[0]?.model, ramGiB:Math.round(totalmem()/1073741824), platform:platform(),arch:arch() }, cases:[] };
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'https://certiva-landing.vercel.app';
  const base = `http://127.0.0.1:${server.address().port}`;
  const headers = { Authorization:`Bearer ${token}`, Origin:origin, 'Content-Type':'application/json' };
  for (const [name, text] of Object.entries(EXAMPLES)) {
    const response = await fetch(base + '/analyze-text', { method:'POST', headers, body:JSON.stringify({text}), signal:AbortSignal.timeout(180000) });
    const result = await response.json();
    assert.equal(response.status, 200, JSON.stringify(result));
    assert.equal(response.headers.get('access-control-allow-origin'), origin);
    assert.equal(result.engine, 'qvac');
    assert.equal(result.model, 'Qwen3 4B');
    evidence.cases.push({name,input:'synthetic text',...result});
    console.log(`${name}: ${result.verdict}, ${result.elapsedMs} ms, ${result.model}`);
    assert.equal(result.verdict, name === 'notice' ? 'sin_senales' : 'fraude');
  }
  const imagePath = new URL('../../data/capturas/fraude-bloqueo_enlace-01.png', import.meta.url);
  const image = 'data:image/png;base64,' + (await readFile(imagePath)).toString('base64');
  const response = await fetch(base + '/analyze-image', { method:'POST', headers, body:JSON.stringify({image}), signal:AbortSignal.timeout(180000) });
  const result = await response.json();
  assert.equal(response.status, 200, JSON.stringify(result));
  assert.equal(result.engine, 'qvac');
  assert.equal(result.vision, 'VisionPsy Nano 460M Flash');
  evidence.cases.push({name:'capture-phishing',input:'data/capturas/fraude-bloqueo_enlace-01.png (synthetic Banco Demo)',...result});
  console.log(`Captura: ${result.verdict}, ${result.elapsedMs} ms, ${result.vision} + ${result.model}`);
  assert.equal(result.verdict, 'fraude');
  evidence.passed = true;
} catch (error) {
  evidence.passed = false;
  evidence.error = error.message;
  console.error(error.message);
} finally {
  const dir = new URL('../../tmp/landing-qvac/', import.meta.url);
  await mkdir(dir, { recursive:true });
  await writeFile(new URL('verification.json', dir), JSON.stringify(evidence, null, 2));
  server.close();
  await unloadQvac();
  process.exit(evidence.passed ? 0 : 1);
}
