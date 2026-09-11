import subprocess,json,pathlib,concurrent.futures
base=pathlib.Path(__file__).resolve().parent
repos={'clik2trip':'JVeraPTY/clik2trip-sovereign','pulso':'jlbjulio/PULSO','ina-igar':'0xj4an/Hackathon-ISD-2026','salus':'Vortecsmaster/Salus'}
def get(u):
 p=subprocess.run(['curl','-fLsS','--max-time','25',u],capture_output=True);return p.stdout if p.returncode==0 else None
def one(x):
 n,r=x;out=base/(n+'-text');out.mkdir(exist_ok=True)
 b=get('https://api.github.com/repos/'+r);d=json.loads(b) if b else {};br=d.get('default_branch','main');(out/'metadata.json').write_text(json.dumps(d))
 b=get('https://api.github.com/repos/'+r+'/git/trees/'+br+'?recursive=1');tree=json.loads(b) if b else {}; (out/'tree.json').write_text(json.dumps(tree))
 files=[f['path'] for f in tree.get('tree',[]) if f['type']=='blob' and f.get('size',0)<180000 and (f['path'].lower().endswith(('.md','.js','.mjs','.ts','.tsx','.py','.kt','.json')) and not any(z in f['path'] for z in ['node_modules/','package-lock','pnpm-lock','yarn.lock','.expo/','vendor/']))]
 def save(p):
  raw=get('https://raw.githubusercontent.com/'+r+'/'+br+'/'+__import__('urllib.parse',fromlist=['quote']).quote(p));
  if raw is not None:
   f=out/p;f.parent.mkdir(parents=True,exist_ok=True);f.write_bytes(raw)
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:list(ex.map(save,files))
 return n,len(files),d.get('pushed_at')
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
 for r in ex.map(one,repos.items()):print(r,flush=True)
