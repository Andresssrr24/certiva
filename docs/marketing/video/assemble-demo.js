// Build inside the Higgsfield sandbox. Source footage and result.json must be
// from the SAME successful Android recording. No synthetic screen generation.
import fs from 'node:fs';
export default async ({project,text,rect,media,frame}) => {
  const dir='/home/user/certiva-demo';
  const evidence=JSON.parse(fs.readFileSync(`${dir}/result.json`,'utf8'));
  if(!evidence.passed || evidence.apkSha256!==evidence.installedApkSha256)
    throw Error('Recording did not pass or installed APK does not match.');
  const fixture=/fixture/i.test(evidence.input||'');
  const p=await project({dir:`${dir}/project`,size:'1920x1080',fps:24,background:'#205094'});
  const brand=await p.add(`${dir}/brand.mp4`);
  const recording=await p.add(`${dir}/android-flow.mp4`);
  if(!(recording.duration>0)||!recording.width||!recording.height)throw Error('Invalid recording');
  const blue='#205094', ink='#152E4E';
  const tx=(s,x,y,w,size,color=ink,weight=700,extra={})=>text(s,{x,y,width:w,height:size*4,fontFamily:'Manrope',fontWeight:weight,fontSize:size,lineHeight:1.12,color,...extra});
  const words={by:'word',from:{opacity:0,y:25},duration:.5,overlap:.4,easing:'house'};
  p.cut(brand,{from:0,dur:4,at:0,fit:'contain'});
  const height=960, width=height*recording.width/recording.height;
  const duration=recording.duration;
  p.compose([
    rect({width:1920,height:1080,fill:'#F4F7FC'}),
    tx('CERTIVA / ANDROID',110,73,940,25,blue),
    tx('Una alerta.\nUna segunda\nmirada.',105,243,900,90,blue,800,{motion:words}),
    tx('Abre el detalle.\nRevisa el motivo.\nDecide qué hacer.',112,623,870,40,ink,500),
    rect({x:112,y:847,width:740,height:3,fill:blue,animate:[{property:'scaleX',from:0,to:1,at:.5,duration:.7,easing:'house'}]}),
    tx(fixture?'Demo de interfaz · Resultado de prueba':'Caso sintético · Grabación del APK',112,893,960,24,ink,500),
    tx(fixture?'Esta toma no ejecuta análisis de IA.':'Prueba en emulador Android.',112,936,960,22,ink,500),
    frame({x:1430-width/2,y:60,width,height,layout:'none',clip:true,radius:22,shadow:{x:0,y:12,blur:30,color:'#152E4E20'}},[
      media({file:recording,width,height,fit:'contain'})
    ])
  ],{at:4,dur:duration,name:'Recorrido continuo del APK'});
  p.cut(brand,{from:4,dur:4,at:4+duration,fit:'contain'});
  await p.frame(4+duration*.25,'renders/demo-25.png');
  await p.frame(4+duration*.5,'renders/demo-50.png');
  await p.frame(4+duration*.75,'renders/demo-75.png');
  await p.render('renders/certiva-demo.mp4',{concurrency:2,shards:4});
};
