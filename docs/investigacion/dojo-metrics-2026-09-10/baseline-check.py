import json,subprocess,pathlib,concurrent.futures,urllib.parse,shutil
b=pathlib.Path(__file__).resolve().parent
spec=[('chen','pixeltabletop/Narukami---Hackathon','57af18a'),('atlas','jlbjulio/ATLAS','c0d250f')]
def run(item):
 name,repo,ref=item
 commit=json.loads(subprocess.check_output(['gh','api',f'repos/{repo}/commits/{ref}'],text=True));sha=commit['sha']
 tree=json.loads(subprocess.check_output(['gh','api',f'repos/{repo}/git/trees/{sha}?recursive=1'],text=True))
 files=[x for x in json.loads((b/(name+'-product-manifest.json')).read_text()) if x['included']]
 blobs={x['path']:x for x in tree['tree'] if x['type']=='blob'}
 old=b/'baseline'/name;new=b/'product-for-diff'/name;old.mkdir(parents=True,exist_ok=True);new.mkdir(parents=True,exist_ok=True)
 def fetch(x):
  p=x['path'];dst=new/p;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(b/'source'/name/p,dst)
  if p in blobs:
   dst=old/p;dst.parent.mkdir(parents=True,exist_ok=True);url=f'https://raw.githubusercontent.com/{repo}/{sha}/'+urllib.parse.quote(p)
   dst.write_bytes(subprocess.check_output(['curl','-fLsS','--retry','2','--max-time','40',url]))
 with concurrent.futures.ThreadPoolExecutor(8) as pool:list(pool.map(fetch,files))
 result=subprocess.run(['perl',str(b/'cloc.pl'),'--diff',str(old),str(new),'--json','--quiet','--timeout=30','--skip-uniqueness'],capture_output=True,text=True,check=True)
 (b/(name+'-baseline-diff.json')).write_text(result.stdout)
 print(name,sha,result.stdout,flush=True)
with concurrent.futures.ThreadPoolExecutor(2) as pool:list(pool.map(run,spec))
