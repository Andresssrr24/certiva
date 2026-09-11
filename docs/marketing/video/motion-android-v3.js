// Native Higgsedit assembly. Requires a verified continuous Android recording.
// Run in the Higgsfield sandbox after supplying capture.json and capture.mp4.
import fs from 'node:fs';

export default async ({project, text, rect, media, frame}) => {
  const base = '/home/user/certiva-android-v3';
  const capture = JSON.parse(fs.readFileSync(`${base}/capture.json`, 'utf8'));
  if (!capture.verified || !capture.apkSha256 || !capture.device || !capture.durationSeconds)
    throw new Error('Missing verified APK capture provenance');
  const p = await project({dir:`${base}/project`,size:'1920x1080',fps:30,background:'#205094'});
  const video = await p.add(`${base}/capture.mp4`);
  const duration = Math.min(capture.durationSeconds, video.duration ?? capture.durationSeconds);
  const tx = (s,x,y,w,size=60,color='#FFFFFF',weight=700,extra={}) => text(s,{
    x,y,width:w,height:size*4,fontFamily:'Manrope',fontWeight:weight,fontSize:size,lineHeight:1.15,color,...extra
  });
  const words = {by:'word',from:{opacity:0,y:24},duration:.5,overlap:.4,easing:'house'};
  p.compose([
    tx('Antes de\nresponder,\nverifica.',110,185,1650,126,'#FFFFFF',800,{motion:words}),
    rect({x:118,y:706,width:910,height:5,fill:'#FFFFFF',animate:[{property:'scaleX',from:0,to:1,at:.6,duration:.65,easing:'house'}]}),
    tx('Certiva · Tu aliado contra el fraude',120,765,1600,37,'#FFFFFF',500)
  ],{at:0,dur:3.5,name:'01 — Antes de responder'});

  // Preserve the whole interaction at its original speed. No invented cursor,
  // result, spinner or synthetic Android UI. Titles sit outside the recording.
  const phoneHeight = 960;
  const phoneWidth = phoneHeight * video.width / video.height;
  p.compose([
    tx('CERTIVA / PILOTO ANDROID',100,72,1000,25),
    tx('Un mensaje.\nUna segunda\nmirada.',100,230,950,88,'#FFFFFF',800,{motion:words}),
    tx('Verificación de texto\nen el dispositivo.',105,612,940,36,'#FFFFFF',500),
    tx('Caso sintético · Reglas locales',105,852,950,25,'#FFFFFF',500),
    tx('Grabación continua en emulador Android',105,904,950,22,'#FFFFFF',500),
    frame({x:1300-phoneWidth/2,y:60,width:phoneWidth,height:phoneHeight,layout:'none',clip:true,radius:20},[
      media({file:video,x:0,y:0,width:phoneWidth,height:phoneHeight,fit:'contain'})
    ])
  ],{at:3.5,dur:duration,name:'02 — Recorrido real sin acelerar'});
  p.compose([
    tx('Antes de responder,\nverifica.',110,238,1700,114,'#FFFFFF',800,{motion:words}),
    tx('Certiva · Tu aliado contra el fraude',120,620,1660,42,'#FFFFFF',500),
    tx('Piloto Android · Verificación de texto con reglas locales',120,860,1650,28,'#FFFFFF',500)
  ],{at:3.5+duration,dur:3.5,name:'03 — Cierre'});
  await p.frame(1.7,'renders/intro.png');
  await p.frame(3.5+duration/2,'renders/recorrido.png');
  await p.render('renders/certiva-android-v3.mp4',{concurrency:2,shards:4});
};
