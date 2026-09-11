import json, subprocess, pathlib, urllib.request, concurrent.futures, shutil, re, datetime, hashlib
base=pathlib.Path(__file__).resolve().parent
old=base.parent/'dojo-analysis-2026-09-10'
d=json.loads((base/'github-metrics.json').read_text())
exts=set('js mjs cjs jsx ts tsx py pyw html htm css scss sass less vue svelte java kt kts swift m mm h hpp c cpp cc cs go rs rb php sh bash zsh fish sql dart r R lua pl pm ex exs erl hrl clj cljs cljc scala sc sol proto graphql gql'.split())
exclude=set('node_modules vendor .venv venv dist build out coverage .next .expo .git __pycache__ docs documentation context target Pods'.split())
def wanted(p):
 q=pathlib.PurePosixPath(p)
 return not set(q.parts)&exclude and (q.suffix.lstrip('.') in exts or q.name in ['Dockerfile','Makefile']) and not re.search(r'\.(min\.(js|css)|bundle\.js|generated\.[^.]+)$',p)
def gh(path):return json.loads(subprocess.check_output(['gh','api',path],text=True))
def run(r):
 name=r['folder'];root=old/name;sha=r['defaultBranchRef']['target']['oid'];dest=base/'source'/name;dest.mkdir(parents=True,exist_ok=True)
 hasgit=(root/'.git').exists(); localsha=subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip() if hasgit else None
 if hasgit and localsha==sha:
  rows=[]
  for line in subprocess.check_output(['git','-C',str(root),'ls-tree','-r',sha],text=True).splitlines():
   meta,p=line.split('\t',1);mode,typ,oid=meta.split();rows.append({'path':p,'sha':oid,'type':typ,'mode':mode})
 else:rows=gh('repos/'+r['nameWithOwner']+'/git/trees/'+sha+'?recursive=1')['tree']
 (base/(name+'-tree.json')).write_text(json.dumps(rows,indent=2))
 chosen=[x for x in rows if x['type']=='blob' and x.get('mode')!='120000' and wanted(x['path'])]
 cached={}
 if (root/'tree.json').exists():cached={x['path']:x['sha'] for x in json.loads((root/'tree.json').read_text())['tree'] if x['type']=='blob'}
 def get(x):
  p=x['path'];target=dest/p;target.parent.mkdir(parents=True,exist_ok=True)
  if hasgit and localsha==sha:
   target.write_bytes(subprocess.check_output(['git','-C',str(root),'show',sha+':'+p]))
  elif cached.get(p)==x['sha'] and (root/p).is_file():shutil.copyfile(root/p,target)
  else:
   url='https://raw.githubusercontent.com/'+r['nameWithOwner']+'/'+sha+'/'+urllib.parse.quote(p)
   target.write_bytes(subprocess.check_output(['curl','-fLsS','--retry','2','--max-time','45',url]))
  raw=target.read_bytes(); actual=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
  assert actual==x['sha'], p+' blob mismatch'
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(get,chosen))
 cmd=['perl',str(base/'cloc.pl'),str(dest),'--json','--quiet','--skip-uniqueness','--timeout=30']
 result=subprocess.run(cmd,capture_output=True,text=True,check=True);loc=json.loads(result.stdout)
 (base/(name+'-cloc.json')).write_text(json.dumps(loc,indent=2));r['loc']=loc.get('SUM',{});r['selected_files']=len(chosen)
 if name=='trustmesh':
  sub=json.loads(subprocess.check_output(['perl',str(base/'cloc.pl'),str(dest/'trustmesh-ai'),'--json','--quiet','--skip-uniqueness'],text=True));r['project_subdirectory_loc']=sub.get('SUM',{})
 print(name,r['loc'],flush=True)
 return r
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:d['repos']=list(pool.map(run,d['repos']))
d['completed_at_utc']=datetime.datetime.now(datetime.timezone.utc).isoformat();d['methodology']={'tool':'cloc 2.10','extensions':sorted(exts),'excluded_directories':sorted(exclude),'code':'Nonblank, noncomment lines in source files including tests, scripts and UI. Excludes JSON/YAML/data/docs/lockfiles and listed dependency/build folders; no attribution of originality.'}
(base/'metrics.json').write_text(json.dumps(d,indent=2))
print('DONE',sum(r['loc']['code'] for r in d['repos']),flush=True)
