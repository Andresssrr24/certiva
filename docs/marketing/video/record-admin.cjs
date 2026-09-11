// Local recording aid for the explicitly selected demo tab. No remote services.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'recordings');
fs.mkdirSync(root,{recursive:true});
const page=`<!doctype html><meta charset="utf-8"><title>Grabación de demo Certiva</title><style>body{font:20px system-ui;background:#f4f7fc;color:#152e4e;padding:60px;max-width:900px}button{font:inherit;padding:16px 24px;border:0;border-radius:12px;background:#205094;color:white;margin-right:16px}p{line-height:1.6}</style><h1>Grabación de demo Certiva</h1><p>Selecciona únicamente la pestaña del piloto bancario. La grabación se guarda en este equipo.</p><button id="start">Grabar pestaña de la consola</button><button id="stop" disabled>Terminar y guardar</button><p id="status">Lista para grabar.</p><script>
let stream,recorder,chunks=[];const status=document.querySelector('#status'),start=document.querySelector('#start'),stop=document.querySelector('#stop');
start.onclick=async()=>{try{stream=await navigator.mediaDevices.getDisplayMedia({video:{displaySurface:'browser',frameRate:24},audio:false,selfBrowserSurface:'exclude'});chunks=[];recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:2500000});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onstop=async()=>{stream.getTracks().forEach(t=>t.stop());status.textContent='Guardando…';const r=await fetch('/recording',{method:'POST',headers:{'Content-Type':'video/webm'},body:new Blob(chunks,{type:'video/webm'})});status.textContent=await r.text();start.disabled=false;stop.disabled=true;};stream.getVideoTracks()[0].onended=()=>{if(recorder.state==='recording')recorder.stop()};recorder.start(500);start.disabled=true;stop.disabled=false;status.textContent='Grabando la pestaña seleccionada.';}catch(e){status.textContent=e.message}};
stop.onclick=()=>{if(recorder?.state==='recording')recorder.stop()};</script>`;
http.createServer((req,res)=>{
 if(req.headers.host!=='127.0.0.1:4324'){res.writeHead(403);return res.end();}
 if(req.method==='GET'&&req.url==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(page);}
 if(req.method==='POST'&&req.url==='/recording'&&req.headers.origin==='http://127.0.0.1:4324'){
  const name='admin-'+new Date().toISOString().replace(/[:.]/g,'-')+'.webm';
  const out=fs.createWriteStream(path.join(root,name),{flags:'wx',mode:0o600});let size=0;
  req.on('data',b=>{size+=b.length;if(size>250*1024*1024){out.destroy();req.destroy();}else out.write(b)});
  req.on('end',()=>out.end(()=>{res.end('Guardado: '+name);console.log(JSON.stringify({file:path.join(root,name),bytes:size}));}));
  req.on('error',()=>out.destroy());return;
 }
 res.writeHead(404);res.end();
}).listen(4324,'127.0.0.1',()=>console.log('Demo recorder: http://127.0.0.1:4324'));
