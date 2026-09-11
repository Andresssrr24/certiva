package local.certiva.qvac;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.LinkedHashMap;

/** Merge only a fixed signal vocabulary; preserve signed-policy abstention and existing strong rules. */
public final class LocalAssessment {
    /** Preserve a detected risk when inference fails, without claiming QVAC coverage. */
    public static JSONObject retainRuleRisk(JSONObject base)throws Exception{
        if(!"riesgo".equals(base.optString("outcome")))return null;
        return new JSONObject(base.toString()).put("coverage","reglas_de_texto").put("aiStatus","unavailable");
    }
    public static JSONObject merge(JSONObject base,JSONObject ai)throws Exception{
        if("no_concluyente".equals(base.optString("outcome")))return base;
        var labels=new LinkedHashMap<String,String>();
        JSONArray original=base.getJSONArray("reasons");
        for(int i=0;i<original.length();i++){JSONObject reason=original.getJSONObject(i);labels.put(reason.getString("code"),reason.getString("title"));}
        JSONArray signals=ai.getJSONArray("signals");
        if(signals.length()>3)throw new IllegalArgumentException("Demasiadas señales");
        for(int i=0;i<signals.length();i++){
            String code=signals.getString(i),label;
            switch(code){
                case "pide_datos_sensibles": label="La IA local detecta una solicitud de clave o código privado";break;
                case "pago_terceros": label="La IA local detecta una solicitud de pago a terceros";break;
                case "urgencia": label="La IA local detecta presión para actuar pronto";break;
                default: throw new IllegalArgumentException("Señal no permitida");
            }
            if(!labels.containsKey(code))labels.put(code,label);
        }
        if(ai.getBoolean("uncertain")&&labels.isEmpty())labels.put("lectura_incompleta","La IA local no pudo interpretar el mensaje con suficiente claridad");
        String outcome=labels.containsKey("lectura_incompleta")?"no_concluyente":labels.containsKey("pide_datos_sensibles")||labels.containsKey("dominio_parecido")||labels.containsKey("pago_terceros")?"riesgo":labels.isEmpty()?"sin_senales":"revisar";
        String title,action;
        switch(outcome){
            case "riesgo":title="Encontramos señales de riesgo";action="No compartas claves ni códigos ni sigas instrucciones de pago. Verifica con el banco desde su app o el número de tu tarjeta.";break;
            case "revisar":title="Conviene revisar este mensaje";action="Confirma la solicitud con el banco desde su app o el número de tu tarjeta antes de actuar.";break;
            case "sin_senales":title="No encontramos señales en este contenido";action="Esto no confirma que el mensaje sea auténtico. Nunca compartas claves ni códigos con otra persona.";break;
            default:title="No pudimos verificarlo";action="Si tienes dudas, contacta al banco desde su app o el número de tu tarjeta.";
        }
        JSONArray reasons=new JSONArray();for(var entry:labels.entrySet())reasons.put(new JSONObject().put("code",entry.getKey()).put("title",entry.getValue()));
        return new JSONObject(base.toString()).put("outcome",outcome).put("title",title).put("action",action).put("reasons",reasons)
            .put("source","qvac_texto").put("sdkVersion","0.3.0-qvac").put("coverage","qvac_y_reglas_locales").put("aiModel",ai.getString("model")).put("aiRuntime",ai.getString("runtime")).put("aiElapsedMs",ai.getLong("elapsedMs")).put("aiBackend",ai.getString("backend"));
    }
}
