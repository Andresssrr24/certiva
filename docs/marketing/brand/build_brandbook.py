from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'output/pdf/Certiva-Brand-Book-v1.pdf'
ICON=ROOT/'docs/marketing/brand/certiva-enlace-icono-v1.png'
for n,f in [('Regular','Arial.ttf'),('Bold','Arial Bold.ttf')]:
 pdfmetrics.registerFont(TTFont(n,'/System/Library/Fonts/Supplemental/'+f))
W,H=960,600
BLUE='#58A9E5'; ICE='#EAF5FD'; INK='#173B56'; MUTED='#46647A'
c=canvas.Canvas(str(OUT),pagesize=(W,H)); c.setTitle('Certiva | Brand Book v1.0');c.setAuthor('Certiva')
def box(x,y,w,h,color,r=0):
 c.setFillColor(HexColor(color));c.roundRect(x,y,w,h,r,fill=1,stroke=0)
def txt(x,y,s,size=16,color=INK,bold=False):
 c.setFillColor(HexColor(color));c.setFont('Bold' if bold else 'Regular',size);c.drawString(x,y,s)
def para(x,y,s,width=370,size=16,color=INK):
 p=Paragraph(s,ParagraphStyle('p',fontName='Regular',fontSize=size,leading=size*1.42,textColor=HexColor(color)))
 _,h=p.wrap(width,500);p.drawOn(c,x,y-h);return y-h
num=0
def page(k,title,sub=''):
 global num
 num+=1;box(0,0,W,H,'#FFFFFF');txt(48,557,'certiva',20,bold=True);txt(665,560,'BRAND BOOK  /  V1.0',10,MUTED)
 txt(48,492,k.upper(),10,BLUE,True);txt(48,450,title,34,bold=True)
 if sub: para(48,423,sub,860,14,MUTED)
 c.setStrokeColor(HexColor(ICE));c.line(48,42,912,42);txt(48,24,'CERTIVA  ·  Inteligencia antifraude local',9,MUTED);txt(865,24,f'{num:02d} / 10',9,MUTED)
def end():c.showPage()
def icon(x,y,s):c.drawImage(str(ICON),x,y,s,s,mask='auto')
# 1
page('Identidad visual y verbal','Antes de responder, verifica.')
para(48,390,'Una identidad clara para ayudar a reconocer señales de engaño antes de actuar.',390,22)
txt(48,236,'certiva',62,bold=True);txt(51,202,'Inteligencia antifraude local',17,MUTED)
para(48,135,'Sistema inicial · Septiembre 2026<br/>Concepto elegido: 03 / Enlace',380,13,MUTED)
icon(545,100,350);end()
# 2
page('01 / Esencia','Claridad antes de actuar.','Certiva acompaña una decisión. Su identidad debe transmitir criterio, cercanía y calma.')
for x,n,t,b in [(48,'01','Propósito','Ayudar a revisar mensajes sospechosos y comprender qué hacer después.'),(345,'02','Promesa','Explicaciones claras, análisis local y revisión cuando la lectura no es concluyente.'),(642,'03','Personalidad','Serena, precisa y accesible. Profesional sin parecer distante; prudente sin alarmar.')]:
 box(x,155,270,215,ICE,16);txt(x+22,332,n,13,BLUE,True);txt(x+22,292,t,23,bold=True);para(x+22,264,b,225,16)
para(48,116,'No prometemos invulnerabilidad. La ausencia de señales no certifica la autenticidad de un mensaje.',840,16);end()
# 3
page('02 / Símbolo','Enlace. Dos piezas, una relación.','La referencia seleccionada es el 03 original: pieza blanca arriba a la izquierda y azul abajo a la derecha.')
icon(55,86,305)
y=365
for title,body in [('Concepto','La unión representa acompañamiento e intercambio de señales. Es una interpretación de marca, no una certificación de seguridad.'),('Rasgos que se conservan','Dos curvas entrelazadas, apertura central, orientación diagonal y contenedor de esquinas suaves.'),('Acabado digital','Volumen suave, luz discreta y profundidad contenida. No añadir brillos intensos, piezas o texturas.')]:
 txt(415,y,title,20,bold=True);y=para(415,y-15,body,450,15)-28
end()
# 4
page('03 / Firma','Una firma simple y consistente.','Escritura oficial: Certiva en textos; certiva en la firma gráfica. Sin separar ni alterar letras.')
box(48,202,560,180,ICE,16);icon(70,226,130);txt(219,277,'certiva',58,bold=True)
box(652,202,260,180,ICE,16);icon(730,260,90);txt(715,222,'certiva',31,bold=True)
para(48,174,'Firma horizontal / uso principal<br/>Símbolo a la izquierda y nombre alineado al centro óptico. Separación sugerida: 1/4 del ancho del ícono.',550,14)
para(652,174,'Firma vertical / espacios compactos<br/>Centrar ambos elementos. Evitar añadir el descriptor en tamaños reducidos.',260,14)
para(48,88,'Composiciones de referencia en este manual. La firma definitiva deberá exportarse como un arte único.',840,12,MUTED);end()
# 5
page('04 / Espacio y escala','Deja respirar al símbolo.','Reglas iniciales para mantener una presencia limpia en piezas digitales.')
icon(120,160,205)
c.setStrokeColor(HexColor(BLUE));c.setDash(4,4);c.rect(78,118,289,289,stroke=1,fill=0);c.setDash()
txt(84,96,'x = 1/4 del ancho del ícono',14,MUTED)
y=360
for title,body in [('Área de protección','Dejar al menos x libre alrededor del contenedor y de la firma. Ningún texto, borde o imagen debe invadirlo.'),('Tamaño de partida','Ícono con volumen: mínimo propuesto 64 px en pantalla. Firma horizontal: 180 px. Validar en el dispositivo y soporte reales.'),('Microformatos e impresión','Para 16–32 px o impresión pequeña, preparar una versión plana simplificada. No reducir este PNG hasta perder la apertura central.')]:
 txt(440,y,title,19,bold=True);y=para(440,y-15,body,435,15)-24
end()
# 6
page('05 / Color','Blanco y azul claro.','Colores normativos de la identidad. Las luces y sombras del ícono son variaciones del acabado, no nuevos colores de marca.')
for x,col,name,hexs in [(48,BLUE,'Azul Certiva',BLUE),(345,ICE,'Azul niebla',ICE),(642,'#FFFFFF','Blanco','#FFFFFF')]:
 box(x,224,270,156,col,14)
 if col=='#FFFFFF':
  c.setStrokeColor(HexColor(ICE));c.roundRect(x,224,270,156,14,stroke=1,fill=0)
 txt(x,192,name,21,bold=True);txt(x,163,hexs,15,MUTED)
box(48,80,45,45,INK,8);txt(110,110,'Azul tinta / #173B56',16,bold=True);para(110,96,'Apoyo funcional para texto y controles. No sustituye al azul claro como color protagonista.',790,12)
end()
# 7
page('06 / Tipografía y lectura','Palabras claras. Jerarquía visible.','Arial Regular y Bold como base operativa accesible. Este manual utiliza esas mismas familias.')
txt(48,328,'Aa',78,bold=True);txt(48,290,'Certiva 0123456789',28);para(48,245,'Títulos: Bold, 32–48 px<br/>Subtítulos: Bold, 20–24 px<br/>Cuerpo: Regular, 16–18 px<br/>Etiquetas: 12–14 px, uso puntual',385,17)
box(494,163,418,218,ICE,16);txt(518,343,'Antes de responder, verifica.',23,bold=True);para(518,316,'Revisa una captura y entiende las señales antes de decidir qué hacer.',360,18)
box(518,193,210,46,BLUE,10);txt(537,209,'Ver demostración',16,INK,True)
para(48,99,'Contraste calculado: azul tinta sobre blanco ≈ 11,7:1; sobre azul claro ≈ 4,6:1. Blanco sobre azul claro ≈ 2,55:1: evitarlo en texto pequeño.',860,13,MUTED);end()
# 8
page('07 / Usos y límites','La coherencia construye reconocimiento.')
for x,head,items,col in [(48,'Usar',['Arte original con proporciones intactas.','Fondos blancos o azul niebla.','Sombra propia del ícono, sin efectos extra.','Texto legible con azul tinta de apoyo.'],ICE),(492,'Evitar',['Girar, estirar o reconstruir las piezas.','Agregar candados o sellos de certificación.','Cambiar colores según la campaña.','Añadir sombras fuertes o fondos recargados.'], '#F4F7FA')]:
 box(x,136,420,260,col,16);txt(x+24,356,head,24,bold=True)
 y=318
 for line in items:y=para(x+24,y,'• '+line,367,16)-17
para(48,96,'Versión plana, monocromática, SVG y favicon: pendientes de producción. No improvisarlas a partir del PNG.',850,13,MUTED);end()
# 9
page('08 / Voz','Precisión sin alarmismo.','Hablar en español claro, con instrucciones concretas y sin garantías absolutas.')
rows=[('Mensaje principal','Antes de responder, verifica.'),('Para el cliente','Revisa ese mensaje antes de compartir un código.'),('Lectura incierta','La lectura no es concluyente. Prueba otra captura o consulta al banco.'),('Para el banco','Ayude a sus clientes a reconocer señales de engaño antes de actuar.')]
y=368
for h,b in rows:
 txt(48,y,h,14,BLUE,True);para(250,y+2,b,640,18);y-=68
para(48,84,'No usar: “100% seguro”, “fraude eliminado” o “avalado por el banco”. Presentar el prototipo de escritorio y la llamada simulada como tales.',850,13,MUTED);end()
# 10
page('09 / Aplicaciones y entrega','Una identidad lista para desarrollar.','Ejemplos conceptuales de comunicación. No representan una integración bancaria ya disponible.')
box(48,196,520,189,ICE,14);icon(63,288,66);txt(141,313,'certiva',26,bold=True);txt(72,265,'Antes de responder,',29,bold=True);txt(72,230,'verifica.',29,bold=True)
box(600,196,312,189,BLUE,14);txt(625,337,'certiva',30,INK,True);para(625,299,'Inteligencia antifraude local.<br/><br/>Ver demostración',255,20)
para(48,166,'Portada de presentación / fondo limpio, una idea y una firma.',520,12,MUTED);para(600,166,'Pieza social / mensaje breve y CTA.',312,12,MUTED)
para(48,119,'Incluido: manual PDF, referencia elegida e ícono PNG recreado en alta resolución. El PNG no es un master vectorial; conservar la referencia para el trazado final.',860,13)
para(48,77,'Próxima producción: SVG plano, firma trazada y tamaños de app. Marca y dominio: disponibilidad no verificada.',860,11,MUTED)
end();c.save();print(OUT)
