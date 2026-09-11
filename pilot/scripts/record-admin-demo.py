#!/usr/bin/env python3
"""Record the real console taking and resolving the case from a passed mobile demo."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import time

p=argparse.ArgumentParser(description=__doc__)
p.add_argument('mobile_result',type=Path)
p.add_argument('output',type=Path)
p.add_argument('--resolve-demo-case',action='store_true',required=True)
a=p.parse_args();mobile=json.loads(a.mobile_result.read_text())
if not mobile.get('passed') or not mobile.get('reportSubmitted'):raise RuntimeError('A passed real mobile report is required')
out=a.output.resolve();out.mkdir(parents=True,exist_ok=False)
adb=[str(Path(os.environ.get('ANDROID_HOME','/opt/homebrew/share/android-commandlinetools'))/'platform-tools/adb'),'-s','emulator-5580']
base='/sdcard/Android/data/local.certiva.pilot/files/'
def run(cmd,**kw):return subprocess.run(adb+cmd,check=kw.pop('check',True),timeout=kw.pop('timeout',20),**kw)
pkg=run(['shell','pm','path','local.certiva.pilot'],capture_output=True,text=True).stdout.strip().removeprefix('package:')
installed=run(['shell','sha256sum',pkg],capture_output=True,text=True).stdout.split()[0]
if installed!=mobile['apkSha256']:raise RuntimeError('Admin must use the same APK as mobile')
for name in ['admin-demo-ready.json','admin-demo-result.json']:run(['shell','rm','-f',base+name])
accounts=json.loads((Path.home()/'Library/Application Support/CertivaPilot/accesos-locales.json').read_text())
account=next(x for x in accounts if x['role']=='analista')
payload=json.dumps({'username':account['id'],'password':account['password'],'caseId':mobile['caseId'],'assessmentId':mobile['assessmentId']}).encode()
run(['shell','-T','run-as','local.certiva.pilot','tee','/data/user/0/local.certiva.pilot/files/admin-demo-private.json'],input=payload,stdout=subprocess.DEVNULL)
run(['shell','run-as','local.certiva.pilot','chmod','600','files/admin-demo-private.json'])
del payload,account,accounts
pid=None;record='/sdcard/certiva-admin-'+str(int(time.time()))+'.mp4'
run_error=None;cleanup_errors=[];recorder_stopped=False
def cleanup(label,cmd,**kw):
    accepted=kw.pop('accepted',(0,))
    try:
        result=run(cmd,check=False,**kw)
        if result.returncode not in accepted:cleanup_errors.append(label+' failed')
        return result
    except (subprocess.TimeoutExpired,OSError):
        cleanup_errors.append(label+' timed out or was unavailable')
        return None
with (out/'instrumentation.txt').open('w') as log:
    process=subprocess.Popen(adb+['shell','am','instrument','-w','-e','class','local.certiva.pilot.AdminDemoTest','local.certiva.pilot.test/android.test.InstrumentationTestRunner'],stdout=log,stderr=subprocess.STDOUT)
    try:
        deadline=time.monotonic()+80
        ready=False
        while process.poll() is None and time.monotonic()<deadline:
            check=run(['shell','cat',base+'admin-demo-ready.json'],capture_output=True,text=True,check=False,timeout=5)
            if check.returncode==0:
                data=json.loads(check.stdout)
                if data.get('ready') and data.get('caseId')==mobile['caseId']:ready=True;break
            time.sleep(1)
        if not ready:raise RuntimeError('Admin did not reach authenticated recording state')
        if run(['shell','pidof','screenrecord'],capture_output=True,text=True,check=False).stdout.strip():raise RuntimeError('Another recording is active')
        pid=run(['shell',f'screenrecord --size 1280x576 --bit-rate 1200000 --time-limit 100 {record} >/dev/null 2>&1 & echo $!'],capture_output=True,text=True).stdout.strip()
        if not re.fullmatch(r'\d+',pid):raise RuntimeError('Recorder did not return its process ID')
        run(['shell','run-as','local.certiva.pilot','touch','files/admin-demo-recording-started'])
        process.wait(timeout=90)
    except (subprocess.TimeoutExpired,RuntimeError,subprocess.CalledProcessError,OSError) as error:
        run_error=type(error).__name__
    finally:
        if pid and re.fullmatch(r'\d+',pid):
            cleanup('Stop recorder',['shell','kill','-2',pid],timeout=5)
            deadline=time.monotonic()+40
            while time.monotonic()<deadline:
                state=cleanup('Check recorder',['shell','pidof','screenrecord'],accepted=(0,1),capture_output=True,text=True,timeout=5)
                if state is not None and state.returncode in (0,1) and pid not in state.stdout.split():
                    recorder_stopped=True
                    break
                time.sleep(0.5)
            video_name='admin-real-flow.mp4' if recorder_stopped else 'admin-real-flow.partial.mp4'
            cleanup('Pull recording',['pull',record,str(out/video_name)],timeout=40)
        if process.poll() is None:
            cleanup('Stop instrumentation',['shell','am','force-stop','local.certiva.pilot'],timeout=10)
            if process.poll() is None:
                process.terminate()
                try:process.wait(timeout=5)
                except subprocess.TimeoutExpired:process.kill();process.wait()
        cleanup('Remove private demo inputs',['shell','run-as','local.certiva.pilot','rm','-f','files/admin-demo-private.json','files/admin-demo-recording-started'],timeout=10)
        cleanup('Pull raw result',['pull',base+'admin-demo-result.json',str(out/'admin-demo-result.json')])
        for phase in ['01-recepcion','02-detalle','03-asignacion','04-conclusion','05-resuelto','06-auditoria']:
            cleanup('Pull '+phase,['pull',base+'admin-'+phase+'.png',str(out/(phase+'.png'))])
raw=out/'admin-demo-result.json'
evidence=json.loads(raw.read_text()) if raw.exists() else {'passed':False,'caseId':mobile['caseId'],'assessmentId':mobile['assessmentId']}
evidence['apkSha256']=mobile['apkSha256'];evidence['installedApkSha256']=installed
evidence['remoteVideo']=record;evidence['recorderStopped']=recorder_stopped
evidence['runError']=run_error;evidence['cleanupErrors']=cleanup_errors
evidence['instrumentationPassed']='OK (1 test)' in (out/'instrumentation.txt').read_text()
evidence['passed']=evidence.get('passed',False) and evidence['instrumentationPassed'] and recorder_stopped and not run_error
if (out/'admin-real-flow.mp4').exists():evidence['videoSha256']=hashlib.sha256((out/'admin-real-flow.mp4').read_bytes()).hexdigest()
(out/'result.json').write_text(json.dumps(evidence,indent=2)+'\n');print(json.dumps(evidence,indent=2))
if not evidence['passed']:raise SystemExit(1)
