#!/usr/bin/env python3
"""Reproducible Certiva conceptual motion edit. Runs in Higgsfield sandbox."""
import argparse, json, math, pathlib, subprocess, urllib.request, wave, array, zipfile
p=argparse.ArgumentParser()
p.add_argument('--urls', nargs=3, required=True)
p.add_argument('--output', default='certiva-demo-motion-v1.mp4')
a=p.parse_args()
root=pathlib.Path('/home/user/certiva-video-v1'); root.mkdir(exist_ok=True)
for i,url in enumerate(a.urls):
    urllib.request.urlretrieve(url,root/f'scene-{i+1}.mp4')
(root/'concat.txt').write_text(''.join("file '"+str(root/f'scene-{i+1}.mp4')+"'\n" for i in range(3)))
header="""[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
WrapStyle: 2
ScaledBorderAndShadow: yes
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Title,Montserrat,56,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,-1,0,1,0,0,7,0,0,0,1
Style: Body,Montserrat,25,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1
Style: Label,Montserrat,17,&H00F5DBC0,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,2,0,1,0,0,7,0,0,0,1
Style: Brand,Montserrat,34,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,-1,0,1,0,0,7,0,0,0,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
events=[]
def ts(s): return f'{int(s)//3600}:{int(s)//60%60:02}:{s%60:05.2f}'
def line(start,end,style,text,x,y,extra='',move=False):
    pos=f'\\move({x},{y+22},{x},{y},0,550)' if move else f'\\pos({x},{y})'
    tags='{'+pos+'\\fad(250,180)'+extra+'}'
    events.append(f'Dialogue: 1,{ts(start)},{ts(end)},{style},,0,0,0,,{tags}{text}')
line(0,30,'Brand','certiva',64,40)
line(0,36,'Label','DEMOSTRACIÓN CONCEPTUAL',64,667,extra='\\fs14\\fsp1')
line(0,12,'Label','UN MENSAJE. UNA DECISIÓN.',64,190)
line(.15,4,'Title','Parece de\\Ntu banco.',64,252,move=True)
line(4.1,8,'Title','Te pide\\Nun código.',64,252,move=True)
line(4.4,8,'Body','“Envíalo ahora para evitar el bloqueo”.',64,429,extra='\\fs23')
line(8.1,12,'Title','Antes de responder,\\Nverifica.',64,252,extra='\\fs49',move=True)
for start,n,title,body in [(12,'01','Revisa.','Carga una captura\\Ndel mensaje.'),(16,'02','Entiende.','Identifica señales\\Nsospechosas.'),(20,'03','Decide.','Si hay dudas, consulta\\Npor un canal oficial.')]:
    line(start+.1,start+4,'Label',n+' / VERIFICACIÓN',64,190)
    line(start+.1,start+4,'Title',title,64,265,move=True)
    line(start+.4,start+4,'Body',body,64,365)
line(24.1,30,'Label','EN TU DISPOSITIVO',64,190)
line(24.1,30,'Title','IA local\\Ncon QVAC.',64,252,move=True)
line(24.5,30,'Body','Prototipo de escritorio.\\NIntegración bancaria propuesta.',64,427,extra='\\fs23')
line(30.15,36,'Title','certiva',640,198,extra='\\an8\\fs108\\fsp-4',move=False)
line(30.55,36,'Body','Tu aliado contra el fraude',640,345,extra='\\an8\\fs31')
line(31.05,36,'Title','Antes de responder, verifica.',640,466,extra='\\an8\\fs34')
(root/'edit.ass').write_text(header+'\n'.join(events),encoding='utf-8')
rate=32000
samples=array.array('h')
chords=[[130.813,164.814,195.998,246.942],[110,130.813,164.814,195.998],[87.307,130.813,174.614,220],[97.999,146.832,195.998,246.942]]
notes=[523.251,659.255,783.991,659.255,440,523.251,659.255,523.251]
for j in range(rate*36):
    t=j/rate; phase=t%4; env=min(1,t/1.5,(36-t)/2)
    chord=chords[int(t/4)%4]; fade=min(1,phase/.25,(4-phase)/.4)
    val=sum(math.sin(2*math.pi*f*t)*.023 for f in chord)*max(0,fade)
    pulse=t%.5; note=notes[int(t/.5)%len(notes)]
    val+=.041*math.exp(-pulse*11)*math.sin(2*math.pi*note*t)
    val+=.025*math.exp(-(t%1)*18)*math.sin(2*math.pi*65*t)
    samples.append(int(max(-1,min(1,val*max(0,env)))*32767))
with wave.open(str(root/'score.wav'),'wb') as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(samples.tobytes())
out=root/a.output
vf="[0:v]crop=800:720:480:0,scale=600:540,fps=30[visual];color=c=0x205094:s=1280x720:r=30:d=36[bg];[bg][visual]overlay=x=650:y=90:enable='lt(t,30)'[base];[base]ass="+str(root/'edit.ass')+"[out]"
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',str(root/'concat.txt'),'-i',str(root/'score.wav'),'-filter_complex',vf,'-map','[out]','-map','1:a','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-t','36','-movflags','+faststart',str(out)],check=True)
# QA sheet of full frames, no image retouching.
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(out),'-vf',"select='eq(n,75)+eq(n,180)+eq(n,300)+eq(n,435)+eq(n,555)+eq(n,675)+eq(n,810)+eq(n,1005)',scale=480:270,tile=2x4",'-frames:v','1',str(root/'contact-sheet.jpg')],check=True)
probe=subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_name,width,height,r_frame_rate','-of','json',str(out)],text=True)
(root/'verification.json').write_text(probe)
with zipfile.ZipFile(root/'certiva-video-editable-v1.zip','w',zipfile.ZIP_DEFLATED) as z:
    for name in ['edit.ass','score.wav','verification.json']:
        z.write(root/name,name)
print(probe)
print(str(out))
