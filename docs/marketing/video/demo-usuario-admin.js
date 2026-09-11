// Native Higgsedit composition. Only accepts successful recordings of the same
// real case. Run in the Higgsfield sandbox with the files listed below.
import fs from 'node:fs';
export default async ({project,text,rect,media,frame})=>{
  const dir='/home/user/certiva-demo';
  const mobile=JSON.parse(fs.readFileSync(`${dir}/real-home-result.json`,'utf8'));
  const admin=JSON.parse(fs.readFileSync(`${dir}/admin-demo-result.json`,'utf8'));
  const server=JSON.parse(fs.readFileSync(`${dir}/admin-server-evidence.json`,'utf8'));
  const provenance=JSON.parse(fs.readFileSync(`${dir}/provenance.json`,'utf8'));
  if(!mobile.passed || !mobile.reportSubmitted)
    throw Error('The real mobile workflow must pass before editing.');
  // Preserve the failed final WebView check in the source result. Independently
  // verified server state and complete visual evidence establish the workflow.
  if(!server.functionalEvidenceVerified || server.caseId!==mobile.caseId || server.assessmentId!==mobile.assessmentId || server.finalCase.state!=='resuelto')
    throw Error('Independent read-only verification of the resolved case is required.');
  if(!['reporte_recibido','caso_asignado','caso_resuelto'].every(event=>server.auditEvents.some(e=>e.event===event && e.case_id===mobile.caseId)))
    throw Error('Missing received, assigned or resolved audit evidence.');
  if(!mobile.caseId || mobile.caseId!==admin.caseId || mobile.assessmentId!==admin.assessmentId)
    throw Error('The user and administrator recordings must follow the same case.');
  if(mobile.coverage!=='reglas_de_texto' || mobile.aiStatus!=='unavailable')
    throw Error('Update the editorial disclosure to match the actual engine.');
  if(!provenance.visualQaPassed || provenance.apkSha256!==provenance.installedApkSha256 || !/^[a-f0-9]{64}$/.test(provenance.apkSha256))
    throw Error('Validate footage, source APK identity and installed APK before rendering.');
  const p=await project({dir:`${dir}/project`,size:'1920x1080',fps:24,background:'#205094'});
  const logo=await p.add(`${dir}/approved-brand.png`);
  const phone=await p.add(`${dir}/real-home.mp4`);
  const console=await p.add(`${dir}/admin-demo.mp4`);
  if(!(phone.duration>0 && console.duration>0))throw Error('Missing source footage.');
  const blue='#205094',ink='#152E4E',muted='#53677F',paper='#F4F7FC';
  const tx=(s,x,y,w,size=60,color=ink,weight=700,extra={})=>text(s,{x,y,width:w,height:size*3.6,fontFamily:'Manrope',fontWeight:weight,fontSize:size,lineHeight:1.12,color,...extra});
  const words={by:'word',from:{opacity:0,y:24},duration:.45,overlap:.4,easing:'house'};
  const signature=(x,y,s,motion)=>frame({x,y,width:840*s,height:280*s,layout:'none',clip:true,radius:22*s,motion},[
    media({file:logo,x:-340*s,y:-40*s,width:1536*s,height:1024*s,fit:'fill'})
  ]);
  const bg=color=>rect({x:0,y:0,width:1920,height:1080,fill:color});
  const shortId=mobile.caseId.slice(0,8);
  let at=0;
  p.compose([
    bg(blue),signature(330,145,1.5,{enter:{from:{opacity:0,y:25,scale:.96},duration:.7,easing:'house'}}),
    tx('Antes de responder,\nverifica.',330,635,1460,83,'#FFFFFF',800,{motion:{...words,at:.3}})
  ],{at,dur:3.5,name:'Marca aprobada'});at+=3.5;
  const phoneAt=at;
  const phoneH=950,phoneW=phoneH*phone.width/phone.height;
  p.compose([
    bg(paper),signature(100,55,.48),tx('01 / EN TU TELÉFONO',560,107,1100,25,blue),
    tx('Revisa el mensaje.\nDecide el\nsiguiente paso.',100,268,1030,80,blue,800,{motion:words}),
    tx('Análisis · Motivos · Consentimiento',107,680,1000,32,ink,500),
    rect({x:108,y:765,width:850,height:4,fill:blue,animate:[{property:'scaleX',from:0,to:1,at:.6,duration:.65,easing:'house'}]}),
    tx('El reporte se envía cuando\nla persona lo confirma.',107,809,990,35,ink,500),
    frame({x:1450-phoneW/2,y:48,width:phoneW,height:phoneH,layout:'none',clip:true,radius:26,shadow:{x:0,y:12,blur:30,color:'#152E4E20'}},[
      media({file:phone,x:0,y:0,width:phoneW,height:phoneH,fit:'contain'})
    ]),
    tx('APK en emulador Android · Caso de demostración · Análisis por reglas locales',106,1020,1750,22,muted,500)
  ],{at,dur:phone.duration,name:'Revisión real, consentimiento y envío desde Android'});at+=phone.duration;
  p.compose([
    bg(blue),signature(100,64,.48),
    tx('Un reporte.\nEl mismo caso.',170,312,1600,105,'#FFFFFF',800,{motion:words}),
    tx(`TELÉFONO  /  ADMINISTRACIÓN       /       ${shortId}`,175,712,1650,32,'#FFFFFF',500),
    rect({x:175,y:820,width:1540,height:4,fill:'#FFFFFF',animate:[{property:'scaleX',from:0,to:1,duration:1,easing:'house'}]})
  ],{at,dur:2.5,name:'Continuidad verificable del caso'});at+=2.5;
  const adminAt=at;
  // Native cuts remove idle waits; UI pixels and action order are preserved.
  const adminCuts=[
    {from:0,dur:3,title:'Un reporte llega al equipo'},
    {from:14,dur:17,title:'Revisa, asigna y resuelve'},
    {from:43,dur:6,title:'Cada decisión deja un registro'}
  ];
  const adminW=1760,adminH=adminW*console.height/console.width;
  if(Math.abs(console.width/console.height-1280/576)>.01)throw Error('Admin source dimensions differ from reviewed footage.');
  for(const cut of adminCuts){
    if(cut.from+cut.dur>console.duration)throw Error('Admin trim exceeds source recording.');
    p.compose([
      bg(paper),signature(80,25,.4),tx('02 / ADMINISTRACIÓN',475,68,1330,26,blue),
      tx(cut.title,80,157,1760,49,blue,800,{motion:words}),
      frame({x:80,y:255,width:adminW,height:adminH-77,layout:'none',clip:true,radius:18,shadow:{x:0,y:10,blur:28,color:'#152E4E20'}},[
        media({file:console,trimStart:cut.from,x:0,y:-44,width:adminW,height:adminH,fit:'fill'})
      ]),
      tx(`Consola real del piloto · Caso ${shortId} · Esperas recortadas`,83,1026,1760,23,muted,500)
    ],{at,dur:cut.dur,name:cut.title});at+=cut.dur;
  }
  p.compose([
    bg(blue),signature(330,150,1.5,{enter:{from:{opacity:0,scale:.96},duration:.7,easing:'house'}}),
    tx('Antes de responder, verifica.',330,650,1480,67,'#FFFFFF',800,{motion:{...words,at:.3}}),
    tx('Piloto Android + consola de administración',334,809,1430,32,'#FFFFFF',500),
    tx('Demostración con un mensaje sintético y reglas locales.',334,906,1440,25,'#FFFFFF',500)
  ],{at,dur:4,name:'Cierre con la firma original'});
  fs.writeFileSync(`${dir}/timeline-summary.json`,JSON.stringify({caseId:mobile.caseId,assessmentId:mobile.assessmentId,phoneAt,adminAt,duration:at+4,phoneDuration:phone.duration,adminSourceDuration:console.duration,adminCuts,adminEditedDuration:adminCuts.reduce((n,c)=>n+c.dur,0)},null,2));
  for(const [name,time] of [['brand',2],['phone',phoneAt+12.5],['admin',adminAt+14],['close',at+2]])await p.frame(time,`renders/${name}.png`);
  await p.render('renders/certiva-demo-usuario-admin.mp4',{concurrency:2,shards:4});
};
