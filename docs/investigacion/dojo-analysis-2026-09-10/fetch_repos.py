import concurrent.futures,subprocess,pathlib,json
base=pathlib.Path(__file__).resolve().parent
repos={'fleetsense':'alioth-stat/phillips-installed-base-intelligence','saja':'jdb17-hub/SAJA_HACKATHON','aegis':'BLeandro5/AEGIS_AI','mam':'pixeltabletop/jajanken-hackathon','clik2trip':'JVeraPTY/clik2trip-sovereign','luma':'george888-q/luma-Inteligencia-de-Base-Instalada-de-Clientes','trustmesh':'srbisnes/SRBISNES','devcors':'HernandoSilvaLeal/expediente-local','zarpe':'Jast-2281/qvac-hackathon-panama','pulso':'jlbjulio/PULSO'}
def fetch(x):
 name,repo=x
 p=subprocess.run(['git','clone','--depth','1','https://github.com/'+repo+'.git',str(base/name)],capture_output=True,text=True,timeout=150,env={**__import__('os').environ,'GIT_TERMINAL_PROMPT':'0'})
 return {'name':name,'repo':repo,'code':p.returncode,'output':p.stderr[-500:]}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
 for r in ex.map(fetch,repos.items()):print(json.dumps(r),flush=True)
