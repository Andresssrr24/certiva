package local.certiva.pilot;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.widget.*;

/** Opened only by an immutable explicit PendingIntent or another app-private screen. */
public final class ProtectionDetailActivity extends Activity {
    private LinearLayout content;
    private int dp(int n){return Math.round(n*getResources().getDisplayMetrics().density);}
    private TextView text(String value,int size,boolean bold){TextView v=new TextView(this);v.setText(value);v.setTextSize(size);v.setTextColor(Color.rgb(21,46,78));v.setPadding(0,dp(9),0,dp(9));if(bold)v.setTypeface(Typeface.DEFAULT,Typeface.BOLD);content.addView(v);return v;}
    private void button(String value,Runnable action){Button b=new Button(this);b.setText(value);b.setAllCaps(false);b.setTextColor(Color.rgb(32,80,148));content.addView(b,new LinearLayout.LayoutParams(-1,dp(58)));ProtectionStyle.button(b,value.equals("Preparar reporte para el piloto"));b.setOnClickListener(v->action.run());}
    @Override public void onCreate(Bundle state){super.onCreate(state);render();}
    @Override public void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);render();}
    private void render(){
        ScrollView scroll=new ScrollView(this);content=new LinearLayout(this);content.setOrientation(LinearLayout.VERTICAL);content.setPadding(dp(24),dp(48),dp(24),dp(30));content.setBackgroundColor(Color.rgb(244,247,252));scroll.addView(content);setContentView(scroll); ProtectionStyle.bars(this);
        content.setOnApplyWindowInsetsListener((v,i)->{v.setPadding(dp(24),Math.max(dp(36),i.getSystemWindowInsetTop()+dp(12)),dp(24),Math.max(dp(24),i.getSystemWindowInsetBottom()));return i;});
        text("certiva",36,true);text("ALERTA DE PROTECCIÓN · WHATSAPP",11,true);
        String id=getIntent().getStringExtra("alert_id");if(id!=null)getSystemService(android.app.NotificationManager.class).cancel(id,1);var result=ProtectionStore.get(this,id);
        if(result==null){text("Esta alerta ya no está disponible",26,true);text("Los resultados se conservan hasta 7 días y pueden borrarse desde Protección.",15,false);button("Volver a protección",()->{startActivity(new Intent(this,ProtectionActivity.class));finish();});return;}
        text(result.optString("title"),29,true);
        text("Señales encontradas",16,true);
        var reasons=result.optJSONArray("reasons");if(reasons!=null)for(int i=0;i<reasons.length();i++)text("• "+reasons.optJSONObject(i).optString("title"),17,false);
        text("Qué puedes hacer ahora",19,true);text(result.optString("action"),17,false);
        button("Cómo contactar a mi banco",()->new AlertDialog.Builder(this).setTitle("Usa un canal de confianza").setMessage("Abre directamente la app de tu banco o usa el número impreso en tu tarjeta. No uses enlaces ni números que lleguen en ese mensaje.\n\nSi compartiste tu clave, solicita al banco cambiarla y revisar tus sesiones.").setPositiveButton("Entendido",null).show());
        button("Preparar reporte para el piloto",()->{startActivity(new Intent(this,MainActivity.class).putExtra("protection_assessment_id",id));finish();});
        button("Ver protección y otras alertas",()->{startActivity(new Intent(this,ProtectionActivity.class));finish();});
        text("Reglas locales · "+result.optString("policyVersion"),12,false);text("Detectado: "+java.text.DateFormat.getDateTimeInstance().format(new java.util.Date(result.optLong("receivedAt"))),12,false);
        text("El resultado no confirma fraude ni autentica al remitente. El mensaje original no se guarda. No hay cambios automáticos en tus accesos bancarios.",12,false);
    }
}
