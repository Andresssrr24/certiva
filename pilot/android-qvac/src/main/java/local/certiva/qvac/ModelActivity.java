package local.certiva.qvac;

import android.app.Activity;
import android.os.Bundle;
import android.widget.*;

public final class ModelActivity extends Activity {
    private TextView status;
    private Button install;
    @Override public void onCreate(Bundle state){
        super.onCreate(state);
        ScrollView scroll=new ScrollView(this);LinearLayout layout=new LinearLayout(this);layout.setOrientation(LinearLayout.VERTICAL);int p=(int)(24*getResources().getDisplayMetrics().density);layout.setPadding(p,p*2,p,p);scroll.addView(layout);setContentView(scroll);
        TextView title=new TextView(this);title.setText("IA en este teléfono");title.setTextSize(28);layout.addView(title);
        TextView info=new TextView(this);info.setText("Certiva ejecuta QVAC y Qwen3 1.7B en Android. Tras instalar el modelo, puedes analizar mensajes sin conexión al Mac ni a un servidor.\n\nLa instalación descarga 1,1 GB desde Hugging Face y verifica su integridad. Usa Wi-Fi si prefieres evitar datos móviles. El envío opcional de reportes al servicio del piloto requiere conexión.\n");info.setTextSize(16);layout.addView(info);
        status=new TextView(this);layout.addView(status);
        install=new Button(this);install.setText("Instalar modelo de IA · 1,1 GB");layout.addView(install);
        install.setOnClickListener(v->{install.setEnabled(false);status.setText("Descargando…");ModelInstall.download(this,(percent,error,done)->{if(isDestroyed())return;status.setText(error!=null?error:done?"Modelo verificado y listo en Android":"Descargando: "+percent+" %");if(done){install.setEnabled(error!=null);}});});
        Button back=new Button(this);back.setText("Volver a Certiva");layout.addView(back);back.setOnClickListener(v->finish());refresh();
    }
    private void refresh(){boolean ready=QvacRuntime.available(this);status.setText(ready?"Modelo verificado en este teléfono":ModelInstall.active()?"Descargando: "+ModelInstall.percent()+" %":"Instala el modelo para activar el análisis con IA");install.setEnabled(!ready&&!ModelInstall.active());}
    @Override public void onResume(){super.onResume();if(status!=null)refresh();}
}
