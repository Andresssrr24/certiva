package local.certiva.pilot;

import android.content.ComponentName;
import android.os.Handler;
import android.os.Looper;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import local.certiva.sdk.CertivaEngine;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayDeque;
import java.util.LinkedHashMap;

/** Opt-in listener. Content is processed in memory by the local SDK, never uploaded. */
public final class CertivaNotificationListener extends NotificationListenerService {
    static volatile boolean connected;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ArrayDeque<String> queue = new ArrayDeque<>();
    private final LinkedHashMap<String,Long> seen = new LinkedHashMap<>();
    private CertivaLocalEngine engine;
    private boolean ready, processing, destroyed;
    private long generation, evaluation;
    private final android.content.SharedPreferences.OnSharedPreferenceChangeListener preferenceListener = (prefs,key) -> {
        if ("enabled".equals(key) && !prefs.getBoolean("enabled",false)) {
            main.post(() -> {
                generation++; processing=false; ready=false; queue.clear(); seen.clear();
                if(engine!=null){engine.close();engine=null;}
            });
        }
    };
    @Override public void onCreate(){super.onCreate();ProtectionStore.prefs(this).registerOnSharedPreferenceChangeListener(preferenceListener);}
    @Override public void onListenerConnected() {
        connected=true;
    }
    @Override public void onListenerDisconnected() {
        connected=false;
        generation++; processing=false; ready=false; queue.clear();
        if(engine!=null){engine.close();engine=null;}
        if (ProtectionStore.enabled(this)) requestRebind(new ComponentName(this,CertivaNotificationListener.class));
    }
    @Override public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || !ProtectionStore.enabled(this) || !NotificationContent.supported(sbn.getPackageName())) return;
        String text;
        try { text = NotificationContent.text(sbn.getNotification()); } catch(RuntimeException e) { return; }
        if (text.isEmpty()) return;
        main.post(() -> enqueue(sbn.getKey(), text));
    }
    private void enqueue(String key, String text) {
        if (destroyed || !ProtectionStore.enabled(this)) return;
        try {
            String fingerprint = android.util.Base64.encodeToString(MessageDigest.getInstance("SHA-256").digest((key+"\n"+text).getBytes(StandardCharsets.UTF_8)),android.util.Base64.NO_WRAP);
            long now = System.currentTimeMillis();
            seen.entrySet().removeIf(e -> now-e.getValue()>120000);
            if (seen.containsKey(fingerprint)) return;
            seen.put(fingerprint,now);
            while(seen.size()>100)seen.remove(seen.keySet().iterator().next());
        } catch(Exception e) { return; }
        if (queue.size() >= 20) queue.removeFirst();
        queue.addLast(text);
        if (engine == null) initialize();
        drain();
    }
    private void initialize() {
        long run = ++generation;
        try {
            engine = new CertivaLocalEngine(this, (unused,error) -> {
                if(destroyed || generation!=run)return;
                if(error!=null) { failure("El motor local necesita revisión"); return; }
                ready=true; drain();
            });
            main.postDelayed(() -> { if(!destroyed && generation==run && !ready)failure("No se pudo iniciar el motor local"); },15000);
        } catch(Exception e) { failure("No se pudo verificar la configuración local"); }
    }
    private void drain() {
        if(destroyed || processing || !ready || queue.isEmpty())return;
        if(!ProtectionStore.enabled(this)){queue.clear();return;}
        processing=true;
        String text=queue.removeFirst();
        long run=generation;
        long request=++evaluation;
        engine.assess(text,"whatsapp",(result,error)->{
            if(destroyed || generation!=run)return;
            processing=false;
            if(!ProtectionStore.enabled(this)){queue.clear();return;}
            if(error!=null){failure(error);return;}
            ProtectionStore.prefs(this).edit().putLong("last_checked",System.currentTimeMillis()).putString("last_status",result.optString("title")).apply();
            if("riesgo".equals(result.optString("outcome")) || "revisar".equals(result.optString("outcome"))) {
                try { ProtectionStore.save(this,result); ProtectionNotifications.post(this,result); }
                catch(Exception e){ProtectionStore.prefs(this).edit().putString("last_status","No se pudo guardar o mostrar la alerta").apply();}
            }
            drain();
        });
        main.postDelayed(() -> { if(!destroyed && generation==run && evaluation==request && processing)failure("La revisión tardó demasiado. Revisa la protección."); },250000);
    }
    private void failure(String status) {
        ProtectionStore.prefs(this).edit().putString("last_status",status).apply();
        generation++;ready=false;processing=false;queue.clear();
        if(engine!=null){engine.close();engine=null;}
    }
    @Override public void onDestroy() {
        ProtectionStore.prefs(this).unregisterOnSharedPreferenceChangeListener(preferenceListener);
        destroyed=true;generation++;queue.clear();seen.clear();main.removeCallbacksAndMessages(null);
        connected=false;
        if(engine!=null)engine.close();
        super.onDestroy();
    }
}
