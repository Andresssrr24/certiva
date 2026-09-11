export default async ({project,text,rect,frame})=>{
 const p=await project({dir:"/home/user/certiva-android-v3/project",size:"1920x1080",fps:24,background:"#205094"});
 const tx=(s,x,y,w,size,color,weight=800,extra={})=>text(s,{x,y,width:w,height:size*3.3,fontFamily:"Manrope",fontWeight:weight,fontSize:size,lineHeight:1.08,color,...extra});
 const words={by:"word",from:{opacity:0,y:35},duration:.55,overlap:.35,easing:"house"};
 p.compose([
  tx("CERTIVA",126,84,1300,25,"#FFFFFF",700,{animate:[{property:"opacity",from:0,to:1,duration:.4}]}),
  tx("Antes de",120,227,1660,132,"#FFFFFF",800,{motion:words}),
  tx("responder,",120,382,1680,132,"#FFFFFF",800,{motion:{...words,at:.25}}),
  frame({x:115,y:573,width:840,height:176,layout:"none",motion:{enter:{from:{x:-50,opacity:0},at:.65,duration:.55,easing:"house"}}},[
   rect({width:840,height:174,radius:25,fill:"#FFFFFF"}),
   tx("verifica.",29,7,795,130,"#205094")
  ]),
  tx("Tu aliado contra el fraude",127,884,1450,37,"#FFFFFF",500,{animate:[{property:"opacity",from:0,to:1,at:1.35,duration:.5}]}),
  rect({x:126,y:827,width:1630,height:2,fill:"#FFFFFF50",animate:[{property:"scaleX",from:0,to:1,at:1,duration:.75,easing:"house"}]})
 ],{at:0,dur:4,name:"Apertura — 4 segundos"});
 p.compose([
  rect({width:1920,height:1080,fill:"#FFFFFF"}),
  rect({x:0,y:0,width:40,height:1080,fill:"#205094",animate:[{property:"scaleY",from:0,to:1,duration:.6,easing:"house"}]}),
  tx("CERTIVA",127,84,1300,25,"#205094",700),
  tx("Una segunda\nmirada.",120,264,1630,140,"#205094",800,{motion:words}),
  rect({x:128,y:650,width:930,height:5,fill:"#205094",animate:[{property:"scaleX",from:0,to:1,at:.65,duration:.65,easing:"house"}]}),
  tx("Antes de responder, verifica.",127,730,1650,50,"#205094",700,{motion:{...words,at:.7}}),
  tx("Tu aliado contra el fraude",128,918,1510,31,"#205094",500,{animate:[{property:"opacity",from:0,to:1,at:1.2,duration:.4}]})
 ],{at:4,dur:4,name:"Cierre — 4 segundos"});
 await p.frame(2.5,"renders/apertura.png");
 await p.frame(6.5,"renders/cierre.png");
 await p.render("renders/brand.mp4",{concurrency:2,shards:2});
};
