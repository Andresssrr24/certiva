package local.certiva.pilot;
import android.content.Context;
import local.certiva.sdk.CertivaEngine;
import local.certiva.qvac.QvacRuntime;
import local.certiva.qvac.LocalAssessment;

/** Native QVAC + signed local policy. Callback remains on Android's main thread. */
public final class CertivaLocalEngine {
    private final CertivaEngine rules;
    private final QvacRuntime qvac;
    private boolean closed;
    public CertivaLocalEngine(Context context,CertivaEngine.Callback initialized)throws Exception{
        qvac=QvacRuntime.get(context);rules=new CertivaEngine(context,initialized);
    }
    public void assess(String text,String channel,CertivaEngine.Callback callback){
        if(closed)return;
        rules.assess(text,channel,(base,error)->{
            if(closed)return;
            if(error!=null){callback.complete(null,error);return;}
            if("no_concluyente".equals(base.optString("outcome"))){callback.complete(base,null);return;}
            qvac.assess(text,(ai,aiError)->{
                if(closed)return;
                if(aiError!=null){
                    try{var retained=LocalAssessment.retainRuleRisk(base);callback.complete(retained,retained==null?aiError:null);}
                    catch(Exception failure){callback.complete(null,aiError);}
                    return;
                }
                try{callback.complete(LocalAssessment.merge(base,ai),null);}
                catch(Exception e){callback.complete(null,"La respuesta de la IA local no fue válida");}
            });
        });
    }
    public void close(){closed=true;rules.close();qvac.unload();}
}
