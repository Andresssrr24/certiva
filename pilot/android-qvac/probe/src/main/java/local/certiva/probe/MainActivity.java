package local.certiva.probe;

/** Real native inference against synthetic messages. APK deliberately has no INTERNET permission. */
public class MainActivity extends android.app.Activity {
 private android.widget.TextView text;
 private int step;
 private org.json.JSONArray results=new org.json.JSONArray();
 private final String[] messages={"Su cuenta será bloqueada hoy. Envíe el código de verificación para desbloquearla.","Hola, nos vemos mañana a las cinco para tomar café.","Nunca compartas tu contraseña ni el código de verificación con nadie."};
 public void onCreate(android.os.Bundle state){super.onCreate(state);text=new android.widget.TextView(this);text.setTextSize(18);text.setPadding(24,60,24,24);setContentView(text);try{MergeChecks.run();next();}catch(Throwable error){text.setText("Merge checks failed: "+error);android.util.Log.e("CertivaQvacProof","Merge checks failed",error);}}
 private void next(){
  if(step==messages.length){save();return;}
  text.setText("Ejecutando QVAC dentro de Android… Caso "+(step+1)+" / "+messages.length);
  local.certiva.qvac.QvacRuntime.get(this).assess(messages[step],(r,e)->{
   try{org.json.JSONObject item=new org.json.JSONObject().put("case",step).put("error",e==null?org.json.JSONObject.NULL:e).put("result",r==null?org.json.JSONObject.NULL:r);results.put(item);android.util.Log.i("CertivaQvacProof",item.toString());step++;if(e!=null){save();return;}next();}catch(Exception failure){text.setText(failure.toString());}
  });
 }
 private void save(){String report;
 try {
  boolean passed=results.length()==3;
  for(int i=0;i<results.length();i++){
   org.json.JSONObject row=results.getJSONObject(i);org.json.JSONObject result=row.optJSONObject("result");
   boolean ok=result!=null && (i==0?result.getJSONArray("signals").toString().contains("pide_datos_sensibles"):result.getJSONArray("signals").length()==0&&!result.getBoolean("uncertain"));
   row.put("passed",ok);passed &= ok;
  }
  boolean internet=checkSelfPermission(android.Manifest.permission.INTERNET)==android.content.pm.PackageManager.PERMISSION_GRANTED;
  report=new org.json.JSONObject().put("passed",passed&&!internet).put("mergeChecks",true).put("internetPermission",internet).put("android",android.os.Build.VERSION.RELEASE).put("device",android.os.Build.MODEL).put("cases",results).toString();
 }catch(Exception e){report="{\"passed\":false}";}text.setText(report);try{java.nio.file.Files.write(new java.io.File(getFilesDir(),"native-proof.json").toPath(),report.getBytes(java.nio.charset.StandardCharsets.UTF_8));}catch(Exception e){text.setText(e.toString());}}
}
