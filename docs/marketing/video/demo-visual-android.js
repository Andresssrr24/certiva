export default async ({project,text,rect,media,frame})=>{
const p=await project({dir:"/home/user/certiva-demo/project",size:"1920x1080",fps:24,background:"#205094"});
const logo=await p.add("/home/user/certiva-demo/approved-brand.png");
const home=await p.add("/home/user/certiva-demo/main.png");
const notice=await p.add("/home/user/certiva-demo/notification.png");
const blue="#205094",ink="#152E4E",muted="#53677F";
const tx=(s,x,y,w,size=60,color=ink,weight=800,extra={})=>text(s,{x,y,width:w,height:size*4,fontFamily:"Manrope",fontWeight:weight,fontSize:size,lineHeight:1.12,color,...extra});
const words={by:"word",from:{opacity:0,y:30},duration:.5,overlap:.4,easing:"house"};
const signature=(x,y,scale,motion)=>frame({x,y,width:840*scale,height:280*scale,layout:"none",clip:true,radius:22*scale,motion},[media({file:logo,x:-340*scale,y:-40*scale,width:1536*scale,height:1024*scale,fit:"fill"})]);
const footer=()=>tx("Capturas reales animadas · Resultado controlado de prueba · Sin inferencia",104,1004,1700,23,muted,500);
p.compose([
rect({x:0,y:0,width:1920,height:1080,fill:blue}),
signature(330,160,1.5,{enter:{from:{opacity:0,y:28,scale:.95},duration:.8,easing:"house"}}),
tx("Antes de responder,\nverifica.",330,650,1450,83,"#FFFFFF",800,{motion:{...words,at:.5}}),
rect({x:336,y:921,width:1240,height:3,fill:"#FFFFFF70",animate:[{property:"scaleX",from:0,to:1,at:1,duration:.8,easing:"house"}]})
],{at:0,dur:4,name:"Firma aprobada — apertura"});
p.compose([
rect({x:0,y:0,width:1920,height:1080,fill:"#F4F7FC"}),
signature(105,53,.48), tx("DEMO VISUAL / ANDROID",570,101,1220,24,blue,700),
tx("Una segunda\nmirada.\nEn tu teléfono.",100,241,990,93,blue,800,{motion:words}),
tx("La nueva interfaz del piloto.",109,644,940,37,ink,500,{animate:[{property:"opacity",from:0,to:1,at:.75,duration:.5}]}),
rect({x:109,y:746,width:760,height:4,fill:blue,animate:[{property:"scaleX",from:0,to:1,at:.85,duration:.7,easing:"house"}]}),
tx("Verificar un mensaje\nProtección y alertas",109,790,900,32,ink,500),
frame({x:1238,y:65,width:405,height:900,layout:"none",clip:true,radius:28,shadow:{x:0,y:16,blur:38,color:"#152E4E28"},motion:{enter:{from:{x:130,y:30,scale:.91,opacity:0},duration:.85,easing:"house"},exit:{to:{x:80,opacity:0},duration:.3}}},[media({file:home,x:0,y:0,width:405,height:900,fit:"contain"})]),
footer()
],{at:4,dur:7,name:"APK real — inicio rediseñado"});
p.compose([
rect({x:0,y:0,width:1920,height:1080,fill:"#F4F7FC"}),
signature(105,53,.48), tx("ALERTA NATIVA DE ANDROID",570,101,1220,24,blue,700),
tx("Antes de\nresponder,\nrevisa esto.",100,288,595,80,blue,800,{motion:words}),
tx("Así aparece la advertencia\nen esta prueba visual.",108,706,625,31,ink,500),
frame({x:782,y:292,width:1058,height:455,layout:"none",clip:true,radius:30,shadow:{x:0,y:16,blur:38,color:"#152E4E20"},motion:{enter:{from:{y:85,scale:.94,opacity:0},duration:.8,easing:"house"},exit:{to:{opacity:0},duration:.3}}},[
media({file:notice,x:-46,y:-611,width:1166.4,height:2592,fit:"fill"})
]),
rect({x:809,y:786,width:972,height:3,fill:blue,animate:[{property:"scaleX",from:0,to:1,at:1,duration:.8,easing:"house"}]}),
tx("Notificación publicada por el APK en el emulador",815,819,990,26,ink,500),
footer()
],{at:11,dur:8,name:"Notificación real — resultado controlado"});
p.compose([
rect({x:0,y:0,width:1920,height:1080,fill:blue}),
signature(330,180,1.5,{enter:{from:{opacity:0,scale:.96},duration:.75,easing:"house"}}),
tx("Antes de responder, verifica.",330,670,1430,69,"#FFFFFF",800,{motion:{...words,at:.3}}),
tx("Demo visual del piloto Android",334,837,1320,31,"#FFFFFF",500)
],{at:19,dur:4,name:"Firma aprobada — cierre"});
await p.frame(2.5,"renders/logo.png");
await p.frame(7.5,"renders/home.png");
await p.frame(14.5,"renders/notification.png");
await p.render("renders/certiva-demo-visual.mp4",{concurrency:2,shards:4});
};
