package local.certiva.pilot;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.NotificationManager;
import android.content.ComponentName;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.provider.Settings;
import android.service.notification.NotificationListenerService;
import android.widget.*;

/** Explicit opt-in and a verifiable status screen for the real Android listener. */
public final class ProtectionActivity extends Activity {
    private LinearLayout layout;
    @Override public void onCreate(Bundle state) { super.onCreate(state); ProtectionNotifications.channel(this); }
    @Override public void onResume() { super.onResume(); render(); }
    private int dp(int n){return Math.round(n*getResources().getDisplayMetrics().density);}
    private TextView text(String value,int size,boolean bold){return ProtectionStyle.text(layout,value,size,bold);}
    private Button button(String value,Runnable action){Button b=new Button(this);b.setText(value);b.setAllCaps(false);b.setTextColor(Color.rgb(32,80,148));layout.addView(b,new LinearLayout.LayoutParams(-1,dp(56)));ProtectionStyle.button(b,value.equals("Activar protección"));b.setOnClickListener(v->action.run());return b;}
    private boolean access(){return getSystemService(NotificationManager.class).isNotificationListenerAccessGranted(new ComponentName(this,CertivaNotificationListener.class));}
    private void render(){
        layout=ProtectionStyle.screen(this);ProtectionStyle.header(layout,"Mi protección");
        text("Protección de WhatsApp",28,true);
        text("Tu día sigue. Certiva está pendiente.",15,false);
        boolean enabled=ProtectionStore.enabled(this), hasAccess=access(), notifications=ProtectionNotifications.allowed(this);
        boolean connected=CertivaNotificationListener.connected;
        boolean modelReady=local.certiva.qvac.QvacRuntime.available(this);
        boolean ready=enabled&&hasAccess&&notifications&&connected&&modelReady;
        LinearLayout page=layout;layout=ProtectionStyle.card(page,ProtectionStyle.TONAL);
        text(ready?"Protección habilitada":"Completa tu protección",22,true);
        text(ready?"Revisamos las notificaciones mientras usas tu teléfono.":"Prepara la IA y autoriza las alertas para empezar.",14,false);
        layout=ProtectionStyle.card(page,android.graphics.Color.WHITE);
        ProtectionStyle.statusRow(layout,"IA en este teléfono",modelReady);
        ProtectionStyle.statusRow(layout,"Tu autorización",enabled);
        ProtectionStyle.statusRow(layout,"Acceso a notificaciones",hasAccess);
        ProtectionStyle.statusRow(layout,"Alertas de Certiva",notifications);
        ProtectionStyle.statusRow(layout,"Servicio conectado",connected);
        layout=page;
        if(!modelReady)button("IA en este teléfono",()->startActivity(new Intent(this,local.certiva.qvac.ModelActivity.class)));
        if(!enabled&&modelReady)button("Activar protección",()->new AlertDialog.Builder(this).setTitle("Permitir revisión de notificaciones")
            .setMessage("Android concede acceso amplio a notificaciones. Certiva procesa únicamente WhatsApp y WhatsApp Business, en este dispositivo. Muestra los resultados de los últimos 7 días y conserva como máximo 20, sin guardar el texto, remitente, enlaces ni códigos.\n\nLa alerta usa QVAC con un modelo instalado en este teléfono, junto con reglas locales. El análisis no requiere conexión al Mac. Puedes desactivarla aquí o revocar el permiso en Ajustes.")
            .setNegativeButton("Ahora no",null).setPositiveButton("Activar",(d,w)->{ProtectionStore.prefs(this).edit().putBoolean("enabled",true).apply();render();requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},200);}).show());
        if(enabled){
            if(!notifications)button("Permitir alertas de Certiva",()->{requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},200);startActivity(new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE,getPackageName()));});
            if(!hasAccess)button("Habilitar acceso a notificaciones",()->startActivity(new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)));
            if(hasAccess&&!connected)button("Reconectar protección",()->{NotificationListenerService.requestRebind(new ComponentName(this,CertivaNotificationListener.class));text("Reconexión solicitada. Vuelve a esta pantalla para comprobar el estado.",12,false);});
            button("Desactivar protección",()->{ProtectionStore.prefs(this).edit().putBoolean("enabled",false).apply();getSystemService(NotificationManager.class).cancelAll();render();});
        }
        ProtectionStyle.disclosure(layout,"Cómo probar las alertas","Concede ambos permisos, vuelve al inicio del teléfono y envía un WhatsApp desde otro teléfono. Mantén WhatsApp fuera de ese chat para que publique una notificación.\n\nAl tocar la alerta de Certiva, se abrirán las señales y los pasos recomendados. Si el contenido está oculto o las notificaciones están silenciadas, Certiva puede no recibir el texto.");
        long checked=ProtectionStore.prefs(this).getLong("last_checked",0);
        text(checked==0?"Todavía no se ha revisado una notificación.":"Última revisión: "+java.text.DateFormat.getDateTimeInstance().format(new java.util.Date(checked)),12,false);
        text(ProtectionStore.prefs(this).getString("last_status",""),12,false);
        text("Alertas recientes",22,true);
        var items=ProtectionStore.alerts(this);
        if(items.length()==0){LinearLayout empty=ProtectionStyle.card(layout,android.graphics.Color.WHITE);ProtectionStyle.text(empty,"Todo en un solo lugar",16,true);ProtectionStyle.text(empty,"Las alertas que recibas aparecerán aquí.",14,false);}
        for(int i=0;i<items.length();i++){var item=items.optJSONObject(i);if(item==null)continue;String id=item.optString("id");button(item.optString("title"),()->startActivity(new Intent(this,ProtectionDetailActivity.class).putExtra("alert_id",id)));}
        if(items.length()>0)button("Borrar resultados locales",()->new AlertDialog.Builder(this).setTitle("Borrar resultados").setMessage("Se eliminarán los resultados guardados en este teléfono.").setNegativeButton("Volver",null).setPositiveButton("Borrar",(d,w)->{ProtectionStore.prefs(this).edit().remove("alerts").apply();getSystemService(NotificationManager.class).cancelAll();render();}).show());
        if(modelReady)button("IA en este teléfono",()->startActivity(new Intent(this,local.certiva.qvac.ModelActivity.class)));
        ProtectionStyle.disclosure(layout,"Privacidad y alcance","El análisis ocurre en este dispositivo. Certiva solo procesa el texto visible de notificaciones de WhatsApp y WhatsApp Business, sin leer su historial ni enviar tus mensajes. Conserva hasta 20 resultados por 7 días, sin el mensaje original. Puedes desactivar la protección cuando quieras.");
        button("Volver a Certiva",this::finish);
    }
    @Override public void onRequestPermissionsResult(int code,String[] permissions,int[] grants){super.onRequestPermissionsResult(code,permissions,grants);render();}
}
