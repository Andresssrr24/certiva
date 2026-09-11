import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBridge} from '../server/bridge.mjs';
test('bridge authenticates, restricts origins and validates input',async t=>{
  let calls=0;
  const {server}=createBridge({token:'local-test-token',sdkAvailable:()=>true,runAnalysis:async()=>{calls++;return{verdict:'fraude',engine:'test-double'};}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base=`http://127.0.0.1:${server.address().port}`;
  const headers={Authorization:'Bearer local-test-token',Origin:'http://127.0.0.1:4317','Content-Type':'application/json'};
  assert.equal((await fetch(base+'/health')).status,401);
  assert.equal((await fetch(base+'/health',{headers:{...headers,Origin:'https://untrusted.example'}})).status,403);
  const health=await fetch(base+'/health',{headers});assert.equal(health.status,200);assert.equal((await health.json()).modelState,'load-on-demand');
  const preflight=await fetch(base+'/analyze-text',{method:'OPTIONS',headers:{Origin:headers.Origin}});assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),headers.Origin);
  assert.equal((await fetch(base+'/analyze-text',{method:'POST',headers,body:'{"text":"a"}'})).status,400);
  assert.equal((await fetch(base+'/analyze-text',{method:'POST',headers,body:'not json'})).status,400);
  assert.equal((await fetch(base+'/analyze-image',{method:'POST',headers,body:'{"image":"file:///etc/passwd"}'})).status,400);
  const good=await fetch(base+'/analyze-text',{method:'POST',headers,body:JSON.stringify({text:'Banco: envíame tu código de acceso.'})});assert.equal(good.status,200);assert.equal(calls,1);
});
test('missing SDK is reported, never simulated as connected inference',async t=>{
  const {server}=createBridge({token:'test',sdkAvailable:()=>false});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
  const res=await fetch(`http://127.0.0.1:${server.address().port}/analyze-text`,{method:'POST',headers:{Authorization:'Bearer test','Content-Type':'application/json'},body:JSON.stringify({text:'Por favor revisa este mensaje.'})});assert.equal(res.status,503);
});
