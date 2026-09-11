from pathlib import Path
import json,subprocess,re,concurrent.futures
b=Path(__file__).resolve().parent
roots={
'aegis':['backend/app/','frontend/src/','frontend/index.html','qvac/server.mjs','qvac/model.mjs'],
'atlas':['src/','web/src/','web/server/','web/index.html','mobile/App.tsx','mobile/src/','mobile/qvac/','mobile/index.ts'],
'chen':['src/','server/','index.html'],
'clik2trip-text':['apps/android/src/','apps/android/App.tsx','packages/','services/'],
'devcors':['core/','ui/','malla/','ia/','instancias/','cli.mjs'],
'fleetsense':['app.py','api.py','qvac_client.py','db.py','extract.py','confidence.py','dedupe.py','frontend/src/','frontend/index.html'],
'ina-igar':['mobile/App.tsx','mobile/src/','mobile/qvac/','mobile/index.tsx','nodo/'],
'luma':['src/','server/','index.html'],
'mam':['src/'],
'pulso-text':['src/'],
'saja':['src/','app.py'],
'salus':['src/'],
'trustmesh':['trustmesh-ai/'],
'zarpe':['src/','public/']}
extra={
'aegis':{'frontend/src/data/demoExtraction.ts':'Simulación de extracción para demo'},
'chen':{'server/fixtures.ts':'Datos y generador sintético','server/planning-fixtures.ts':'Datos y generador sintético'},
'clik2trip-text':{'packages/qvac-edge/src/demo-catalog.ts':'Catálogo de datos de demostración, incluye pequeño envoltorio de código','apps/android/src/theme/brand.ts':'Tokens visuales preexistentes declarados','apps/android/src/components/QualityEvaluationPanel.tsx':'Pantalla de evaluación técnica','apps/android/src/evaluation/':'Evaluación técnica'},
'fleetsense':{'frontend/src/components/ui/':'Componentes genéricos shadcn/ui; exclusión conservadora, puede descartar adaptaciones propias'},
'ina-igar':{'nodo/probar-p2p.mjs':'Prueba P2P','nodo/probe-p2p.mjs':'Prueba P2P','nodo/Dockerfile':'Infraestructura','mobile/src/ConsolaDemo.tsx':'Consola de demostración','mobile/src/demoLog.ts':'Registro de demostración','mobile/src/perf/':'Instrumentación de benchmark'},
'salus':{'src/features/component-gallery/':'Galería de desarrollo','src/services/storage/seeds.ts':'Datos sintéticos'},
}
def matching(p,r):return p.startswith(r) if r.endswith('/') else p==r
def count(n):
 root=b/'source'/n;d=json.loads(subprocess.check_output(['perl',str(b/'cloc.pl'),str(root),'--by-file','--json','--quiet','--skip-uniqueness','--timeout=30'],text=True));files={str(Path(k).relative_to(root)):v for k,v in d.items() if k not in ['header','SUM']};assert sum(v['code'] for v in files.values())==d['SUM']['code']
 manifest=[]
 for p,v in files.items():
  reason='Producto: lógica, interfaz, estilos e integración';keep=True
  if not any(matching(p,r) for r in roots[n]):keep=False;reason='Fuera de rutas de producto: pruebas, herramientas, entrenamiento, marketing, configuración, compilados o proyectos distintos'
  elif re.search(r'(^|/)(__tests__|tests|pruebas)/|\.(test|spec)\.|(^|/)test_',p):keep=False;reason='Prueba automatizada'
  else:
   for pattern,note in extra.get(n,{}).items():
    if matching(p,pattern):keep=False;reason=note;break
  manifest.append({'path':p,'code':v['code'],'language':v['language'],'included':keep,'reason':reason})
 product=sum(x['code'] for x in manifest if x['included']);(b/(n+'-product-manifest.json')).write_text(json.dumps(manifest,ensure_ascii=False,indent=2));return {'folder':n,'snapshot_code':d['SUM']['code'],'product_code':product,'excluded':d['SUM']['code']-product,'product_files':sum(x['included'] for x in manifest)}
rows=list(concurrent.futures.ThreadPoolExecutor(4).map(count,roots));(b/'product-counts.json').write_text(json.dumps(rows,indent=2));print(json.dumps(rows,indent=2));print('TOTAL',sum(r['product_code'] for r in rows))
