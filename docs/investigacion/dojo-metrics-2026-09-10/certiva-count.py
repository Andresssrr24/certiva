from pathlib import Path
import json,subprocess,base64,concurrent.futures,hashlib,datetime,re,collections
b=Path(__file__).resolve().parent; repo=b.parent/'antifraude-qvac';dest=b/'source/certiva';sha='35339b846c4f0368d3856fbc12f99c64657434a4'
tree=json.loads((b/'certiva-main-tree.json').read_text());exts=set('js mjs cjs jsx ts tsx py html css swift java kt'.split())
rows=[x for x in tree['tree'] if x['type']=='blob' and Path(x['path']).suffix[1:] in exts and not set(Path(x['path']).parts)&{'data','docs','output','tmp','build','node_modules'}]
def fetch(x):
 p=x['path'];dst=dest/p;dst.parent.mkdir(parents=True,exist_ok=True)
 r=subprocess.run(['git','-C',str(repo),'cat-file','blob',x['sha']],capture_output=True)
 if r.returncode==0:raw=r.stdout
 else:
  local=repo/p;raw=local.read_bytes() if local.is_file() else b''
  actual=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
  if actual!=x['sha']:
   data=json.loads(subprocess.check_output(['gh','api','repos/Andresssrr24/certiva/git/blobs/'+x['sha']],text=True));raw=base64.b64decode(data['content'])
 assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==x['sha']
 dst.write_bytes(raw)
with concurrent.futures.ThreadPoolExecutor(6) as pool:list(pool.map(fetch,rows))
d=json.loads(subprocess.check_output(['perl',str(b/'cloc.pl'),str(dest),'--by-file','--json','--quiet','--skip-uniqueness','--timeout=30'],text=True));(b/'certiva-files.json').write_text(json.dumps(d,indent=2))
for k,v in d.items():
 if k not in ['header','SUM']:print(str(Path(k).relative_to(dest)),v['code'])
print('SUM',d['SUM'])
