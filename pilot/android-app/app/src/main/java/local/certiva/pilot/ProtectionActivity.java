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
    private TextView text(String value,int size,boolean bold){TextView v=new TextView(this);v.setText(value);v.setTextSize(size);v.setTextColor(Color.rgb(21,46,78));v.setPadding(0,dp(8),0,dp(8));if(bold)v.setTypeface(Typeface.DEFAULT,Typeface.BOLD);layout.addView(v);return v;}
    private Button button(String value,Runnable action){Button b=new Button(this);b.setText(value);b.setAllCaps(false);b.setTextColor(Color.rgb(32,80,148));layout.addView(b,new LinearLayout.LayoutParams(-1,dp(56)));ProtectionStyle.button(b,value.equals("Activar protección"));b.setOnClickListener(v->action.run());return b;}
    private boolean access(){return getSystemService(NotificationManager.class).isNotificationListenerAccessGranted(new ComponentName(this,CertivaNotificationListener.class));}
    private void render(){
        ScrollView scroll=new ScrollView(this);layout=new LinearLayout(this);layout.setOrientation(LinearLayout.VERTICAL);layout.setPadding(dp(24),dp(45),dp(24),dp(30));layout.setBackgroundColor(Color.rgb(244,247,252));scroll.addView(layout);setContentView(scroll); ProtectionStyle.bars(this);
        layout.setOnApplyWindowInsetsListener((v,i)->{v.setPadding(dp(24),Math.max(dp(36),i.getSystemWindowInsetTop()+dp(12)),dp(24),Math.max(dp(24),i.getSystemWindowInsetBottom()));return i;});
        text("certiva",36,true);text("Protección de WhatsApp",27,true);
        boolean enabled=ProtectionStore.enabled(this), hasAccess=access(), notifications=ProtectionNotifications.allowed(this);
        boolean connected=CertivaNotificationListener.connected;
        text(enabled&&hasAccess&&notifications&&connected?"● Protección habilitada":"○ Revisa la configuración",18,true);
        text("1. Tu autorización: "+(enabled?"activada":"pendiente")+"\n2. Acceso a notificaciones: "+(hasAccess?"concedido":"pendiente")+"\n3. Alertas de Certiva: "+(notifications?"permitidas":"pendientes")+"\n4. Servicio: "+(connected?"conectado":"sin conexión confirmada"),14,false);
        text("Certiva revisa localmente el texto que Android muestra en las notificaciones de WhatsApp y WhatsApp Business. No lee el historial ni envía tus mensajes. Puedes usar otras apps mientras está habilitada.",15,false);
        if(!enabled)button("Activar protección",()->new AlertDialog.Builder(this).setTitle("Permitir revisión de notificaciones")
            .setMessage("Android concede acceso amplio a notificaciones. Certiva procesa únicamente WhatsApp y WhatsApp Business, en este dispositivo. Muestra los resultados de los últimos 7 días y conserva como máximo 20, sin guardar el texto, remitente, enlaces ni códigos.\n\nLa alerta se basa en reglas locales; este APK no incluye el modelo QVAC de escritorio. Puedes desactivarla aquí o revocar el permiso en Ajustes.")
            .setNegativeButton("Ahora no",null).setPositiveButton("Activar",(d,w)->{ProtectionStore.prefs(this).edit().putBoolean("enabled",true).apply();render();requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},200);}).show());
        if(enabled){
            if(!notifications)button("Permitir alertas de Certiva",()->{requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},200);startActivity(new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE,getPackageName()));});
            if(!hasAccess)button("Habilitar acceso a notificaciones",()->startActivity(new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)));
            if(hasAccess&&!connected)button("Reconectar protección",()->{NotificationListenerService.requestRebind(new ComponentName(this,CertivaNotificationListener.class));text("Reconexión solicitada. Vuelve a esta pantalla para comprobar el estado.",12,false);});
            button("Desactivar protección",()->{ProtectionStore.prefs(this).edit().putBoolean("enabled",false).apply();getSystemService(NotificationManager.class).cancelAll();render();});
        }
        text("Prueba en tu teléfono",20,true);
        text("Concede ambos permisos, vuelve al inicio del teléfono y envía un WhatsApp desde otro teléfono. Mantén WhatsApp fuera de ese chat para que publique una notificación.\n\nEjemplo: “Su cuenta será bloqueada hoy. Envíe el código de verificación para desbloquearla.”\n\nAl tocar la alerta de Certiva, se abrirán las señales y los pasos recomendados.",14,false);
        text("Si WhatsApp oculta el contenido, el chat está abierto, las notificaciones están silenciadas o Android restringe el servicio, la detección puede no recibir el texto. No se evita ninguna restricción del sistema.",12,false);
        long checked=ProtectionStore.prefs(this).getLong("last_checked",0);
        text(checked==0?"Todavía no se ha revisado una notificación.":"Última revisión: "+java.text.DateFormat.getDateTimeInstance().format(new java.util.Date(checked)),12,false);
        text(ProtectionStore.prefs(this).getString("last_status",""),12,false);
        text("Alertas recientes",20,true);
        var items=ProtectionStore.alerts(this);
        if(items.length()==0)text("Todavía no hay alertas guardadas.",14,false);
        for(int i=0;i<items.length();i++){var item=items.optJSONObject(i);if(item==null)continue;String id=item.optString("id");button(item.optString("title"),()->startActivity(new Intent(this,ProtectionDetailActivity.class).putExtra("alert_id",id)));}
        if(items.length()>0)button("Borrar resultados locales",()->new AlertDialog.Builder(this).setTitle("Borrar resultados").setMessage("Se eliminarán los resultados guardados en este teléfono.").setNegativeButton("Volver",null).setPositiveButton("Borrar",(d,w)->{ProtectionStore.prefs(this).edit().remove("alerts").apply();getSystemService(NotificationManager.class).cancelAll();render();}).show());
        button("Volver a verificación manual",this::finish);
    }
    @Override public void onRequestPermissionsResult(int code,String[] permissions,int[] grants){super.onRequestPermissionsResult(code,permissions,grants);render();}
}
