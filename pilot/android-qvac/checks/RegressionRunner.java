package local.certiva.probe;
import org.json.*;
import local.certiva.qvac.LocalAssessment;

/** JVM regression check; this does not claim native Android inference coverage. */
public final class RegressionRunner {
 public static void main(String[] args)throws Exception {
  MergeChecks.run();
  JSONObject base=new JSONObject().put("outcome","riesgo").put("source","texto").put("sdkVersion","0.1.0").put("reasons",new JSONArray().put(new JSONObject().put("code","pide_datos_sensibles")));
  JSONObject kept=LocalAssessment.retainRuleRisk(base);
  if(!"riesgo".equals(kept.getString("outcome")) || !"texto".equals(kept.getString("source")) || !"0.1.0".equals(kept.getString("sdkVersion")) || !"reglas_de_texto".equals(kept.getString("coverage")) || !"unavailable".equals(kept.getString("aiStatus")) || kept.has("aiModel") || !"pide_datos_sensibles".equals(kept.getJSONArray("reasons").getJSONObject(0).getString("code"))) throw new AssertionError("Rule risk provenance changed on unavailable AI");
  if(base.has("aiStatus"))throw new AssertionError("Original rule result mutated");
  base.put("outcome","sin_senales");if(LocalAssessment.retainRuleRisk(base)!=null)throw new AssertionError("Missing AI treated as a completed harmless assessment");
  System.out.println("PASS: merge preservation, abstention, allowed signals, untrusted text projection, unknown signal rejection, unavailable AI risk provenance, non-mutation, no false completed assessment");
 }
}
