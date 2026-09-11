package local.certiva.probe;
import local.certiva.qvac.LocalAssessment;
import org.json.JSONObject;
import org.json.JSONArray;

final class MergeChecks {
 static void run()throws Exception{
  JSONObject base=new JSONObject().put("outcome","riesgo").put("reasons",new JSONArray().put(new JSONObject().put("code","pide_datos_sensibles").put("title","Regla firmada")));
  JSONObject ai=new JSONObject().put("signals",new JSONArray()).put("uncertain",false).put("model","test").put("runtime","test").put("elapsedMs",1).put("backend","cpu");
  if(!"riesgo".equals(LocalAssessment.merge(base,ai).getString("outcome")))throw new AssertionError("AI must not downgrade a strong local rule");
  base.put("outcome","no_concluyente");if(!"no_concluyente".equals(LocalAssessment.merge(base,ai).getString("outcome")))throw new AssertionError("AI must not override signed-policy abstention");
  base.put("outcome","sin_senales").put("reasons",new JSONArray());ai.put("signals",new JSONArray().put("pago_terceros"));
  JSONObject merged=LocalAssessment.merge(base,ai);if(!"riesgo".equals(merged.getString("outcome")))throw new AssertionError("AI must add its allowed semantic signal");
  ai.put("text","DO_NOT_PERSIST").put("reason","DO_NOT_PERSIST");if(LocalAssessment.merge(base,ai).toString().contains("DO_NOT_PERSIST"))throw new AssertionError("Untrusted text escaped projection");
  ai.put("signals",new JSONArray().put("unapproved_signal"));boolean rejected=false;try{LocalAssessment.merge(base,ai);}catch(IllegalArgumentException e){rejected=true;}if(!rejected)throw new AssertionError("Unknown signal accepted");
 }
}
