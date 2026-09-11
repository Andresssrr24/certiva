import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyzeText,extractDomains,EXAMPLES} from '../public/analyzer.js';
test('examples classify phishing, code theft, and an informational notice',()=>{
  assert.equal(analyzeText(EXAMPLES.phishing).verdict,'fraude');
  assert.equal(analyzeText(EXAMPLES.code).verdict,'fraude');
  assert.equal(analyzeText(EXAMPLES.notice).verdict,'sin_senales');
});
test('does not authenticate lookalikes, deceptive suffixes or URL userinfo',()=>{
  for(const url of ['https://cajadeahorros.com.pa.evil.example','https://cajadeahorros.com.pa@evil.example','https://cajadeahorr0s.com.pa','https://bit.ly/abc','https://192.168.1.1/login'])assert.equal(analyzeText('Caja de Ahorros: revisa tu cuenta en '+url).verdict,'fraude',url);
  assert.deepEqual(extractDomains('https://cajadeahorros.com.pa@evil.example'),['evil.example']);
});
test('negated warnings do not hide a separate request',()=>{
  assert.equal(analyzeText('Nunca compartas tu contraseña ni tu código con nadie.').verdict,'sin_senales');
  assert.equal(analyzeText('No compartas tu contraseña, pero envíame tu código de acceso.').verdict,'fraude');
  assert.equal(analyzeText('No envíes tu contraseña. Envíame el código de verificación.').verdict,'fraude');
});
test('official domain and missing input are handled without a safe verdict',()=>{
  assert.equal(analyzeText('Visita directamente https://www.cajadeahorros.com.pa para consultar información.').verdict,'sin_senales');
  assert.throws(()=>analyzeText(''),/12 caracteres/);
  assert.throws(()=>analyzeText('a'.repeat(5001)),/5000/);
  assert.equal(analyzeText('111111111111111111').verdict,'no_legible');
});
test('urgency alone is suspicious, not confirmed fraud',()=>assert.equal(analyzeText('Último aviso: la solicitud vence hoy mismo.').verdict,'sospechoso'));
