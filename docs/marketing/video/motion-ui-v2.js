export default async ({project,text,rect,media,frame,path})=>{
 const p=await project({dir:"/home/user/certiva-ui-v2/project",size:"1920x1080",fps:24,background:"#F4F7FC"});
 const app=await p.add("/home/user/certiva-ui-v2/home.png");
 const BLUE="#205094", INK="#152E4E", MUTED="#54677E";
 const tx=(s,x,y,w,size=56,color=INK,weight=800,extra={})=>text(s,{x,y,width:w,height:Math.max(70,size*4),fontFamily:"Manrope",fontWeight:weight,fontSize:size,lineHeight:1.15,color,...extra});
 const enter={enter:{from:{y:35,opacity:0},duration:.7,easing:"house"},exit:{to:{opacity:0},duration:.25}};
 const cap=(s)=>[tx("CERTIVA  /  DIRECCIÓN DE MOTION",90,46,1300,22,BLUE,700),tx(s,90,995,1710,23,MUTED,500)];
 const screenshot=(x,y,w,h,motion)=>frame({x,y,width:w,height:h,layout:"none",radius:22,clip:true,shadow:{x:0,y:16,blur:36,color:"#152E4E20"},motion},
  [media({file:app,x:0,y:0,width:w,height:h,fit:"contain"})]);
 p.compose([
  ...cap("Pantalla real del prototipo · Captura animada · Inferencia pendiente de habilitar"),
  tx("Antes de\nresponder,\nverifica.",100,250,1000,106,BLUE,800,{motion:{by:"word",from:{opacity:0,y:30},at:.1,duration:.6,overlap:.45,easing:"house"}}),
  frame({x:1210,y:100,width:457,height:850,layout:"none",clip:true,radius:38,motion:{enter:{from:{y:120,scale:.85,opacity:0},duration:.95,easing:"house"},exit:{to:{x:50,opacity:0},duration:.3}}},
   [media({file:app,x:-77,y:-193,width:1656,height:1104,fit:"fill"})]),
  rect({x:105,y:675,width:600,height:5,fill:BLUE,animate:[{property:"scaleX",from:0,to:1,at:1,duration:.7,easing:"house"}]}),
  tx("Tu aliado contra el fraude",107,724,950,37,MUTED,500,{animate:[{property:"opacity",from:0,to:1,at:1.5,duration:.6}]})
 ],{at:0,dur:5,name:"01 — Producto real"});
 p.compose([
  ...cap("Pantalla real del prototipo · Captura animada · Inferencia pendiente de habilitar"),
  tx("01",96,222,300,28,BLUE,700),
  tx("Mi\nprotección.",90,290,430,76,INK,800,{motion:{by:"word",from:{y:25,opacity:0},duration:.5,overlap:.3,easing:"house"}}),
  tx("El inicio de\nla experiencia.",95,520,420,33,MUTED,500),
  screenshot(585,132,1254,836,{enter:{from:{x:180,scale:.94,opacity:0},duration:.8,easing:"house"},exit:{to:{opacity:0},duration:.2}}),
  rect({x:682,y:648,width:256,height:45,radius:13,fill:"#FFFFFF00",strokeColor:BLUE,strokeWidth:4,at:6.5,duration:3.2,animate:[{property:"opacity",keyframes:[{at:0,value:0},{at:.3,value:1},{at:1.2,value:.2},{at:1.8,value:1},{at:3.2,value:0}]}]})
 ],{at:5,dur:5,name:"02 — Home Certiva"});
 p.compose([
  ...cap("Mensajes sintéticos del propio prototipo · Acercamiento editorial, sin ejecutar análisis"),
  tx("02",96,222,300,28,BLUE,700),
  tx("Capturas\ny ejemplos.",90,290,490,74,INK,800,{motion:{by:"word",from:{y:25,opacity:0},duration:.5,overlap:.3,easing:"house"}}),
  tx("Una segunda\nmirada al mensaje.",95,525,460,32,MUTED,500),
  frame({x:650,y:184,width:1170,height:650,layout:"none",clip:true,radius:25,shadow:{x:0,y:14,blur:28,color:"#152E4E18"},motion:{enter:{from:{x:100,opacity:0},duration:.7,easing:"house"},exit:{to:{opacity:0},duration:.25}}},
   [media({file:app,x:-648,y:-403,width:1821.6,height:1214.4,fit:"fill",animate:[{property:"scale",from:1,to:1.025,duration:5,easing:"linear"}]})]),
  frame({x:1008,y:852,width:700,height:90,layout:"none",at:11.1,duration:3.6,motion:enter},[
   rect({width:700,height:76,radius:18,fill:BLUE}),
   tx("«WhatsApp: ejecutivo del banco»",24,22,652,29,"#FFFFFF",600)
  ])
 ],{at:10,dur:5,name:"03 — Ejemplos reales de interfaz"});
 p.compose([
  rect({width:1920,height:1080,fill:BLUE}),
  tx("ESTADO DE ESTA SESIÓN",110,135,1650,25,"#FFFFFF",600),
  tx("La interfaz está lista.\nEl análisis aún no.",105,262,1690,91,"#FFFFFF",800,{motion:{by:"word",from:{y:25,opacity:0},duration:.55,overlap:.4,easing:"house"}}),
  tx("Falta instalar QVAC y sus modelos\npara grabar un resultado real.",110,551,1660,43,"#FFFFFF",500,{animate:[{property:"opacity",from:0,to:1,at:1.5,duration:.6}]}),
  rect({x:110,y:783,width:1650,height:2,fill:"#FFFFFF55",animate:[{property:"scaleX",from:0,to:1,at:1.8,duration:.7,easing:"house"}]}),
  tx("Muestra de dirección visual · No es todavía la demo funcional",110,829,1640,29,"#FFFFFF",500)
 ],{at:15,dur:5,name:"04 — Límite verificado"});
 await p.frame(2.8,"renders/01.png");
 await p.frame(7.8,"renders/02.png");
 await p.frame(12.8,"renders/03.png");
 await p.frame(18.3,"renders/04.png");
 await p.render("renders/certiva-motion-ui-v2.mp4",{concurrency:2,shards:4});
};
