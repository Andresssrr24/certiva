package local.certiva.pilot;

import org.json.JSONArray;
import org.json.JSONObject;

/** UI-only fixture. No inference is run and no report is sent; never an accuracy benchmark. */
public class UiFixtureFlowTest extends ProtectionFlowTest {
    private String previousAlerts;
    private boolean previousEnabled;
    @Override protected void setUp() throws Exception {
        super.setUp();
        if(!"goldfish".equals(android.os.Build.HARDWARE)&&!"ranchu".equals(android.os.Build.HARDWARE))throw new IllegalStateException("UI fixture is restricted to the dedicated emulator");
        var context=getInstrumentation().getTargetContext();
        var prefs=ProtectionStore.prefs(context);
        previousAlerts=prefs.getString("alerts","[]");previousEnabled=prefs.getBoolean("enabled",false);
        prefs.edit().putBoolean("enabled",false).remove("alerts").commit();
        JSONObject fixture=new JSONObject().put("id","ui-fixture-alert").put("outcome","riesgo")
            .put("title","Encontramos señales de riesgo")
            .put("action","No compartas claves ni códigos. Verifica con el banco desde su app o el número de tu tarjeta.")
            .put("coverage","Prueba visual con resultado controlado; sin inferencia")
            .put("channel","whatsapp").put("source","ui_fixture").put("policyVersion","ui-fixture")
            .put("sdkVersion","ui-fixture").put("evaluatedAt",java.time.Instant.now().toString())
            .put("reasons",new JSONArray().put(new JSONObject().put("code","pide_datos_sensibles").put("title","Te piden tu clave o tu código")));
        ProtectionStore.save(context,fixture);
    }
    @Override protected void tearDown() throws Exception {
        try {
            if(previousAlerts!=null){
                var context=getInstrumentation().getTargetContext();
                context.getSystemService(android.app.NotificationManager.class).cancel("ui-fixture-alert",1);
                ProtectionStore.prefs(context).edit().putString("alerts",previousAlerts).putBoolean("enabled",previousEnabled).commit();
            }
        } finally {super.tearDown();}
    }
}
