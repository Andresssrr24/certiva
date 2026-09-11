package local.certiva.pilot;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.graphics.Color;
import android.graphics.Typeface;
import android.text.InputType;
import android.text.TextWatcher;
import android.text.Editable;
import android.view.View;
import android.view.WindowManager;
import android.widget.*;
import org.json.JSONObject;
import local.certiva.sdk.CertivaEngine;

public final class MainActivity extends Activity {
    private final int blue = Color.rgb(32,80,148), ink = Color.rgb(20,42,71);
    private LinearLayout content, resultBox;
    private EditText message;
    private Spinner channel;
    private Button analyze, account;
    private TextView status;
    private CertivaEngine engine;
    private JSONObject assessment;
    private final PilotAPI api = new PilotAPI();
    private int revision;
    private boolean alive = true;
    private String pendingProtectionId;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        pendingProtectionId=getIntent().getStringExtra("protection_assessment_id");
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        ScrollView scroll = new ScrollView(this); scroll.setFillViewport(true);
        content = new LinearLayout(this); content.setOrientation(LinearLayout.VERTICAL); content.setPadding(dp(24),dp(52),dp(24),dp(30)); content.setBackgroundColor(Color.rgb(244,247,251));
        scroll.addView(content); setContentView(scroll); ProtectionStyle.bars(this);
        content.setOnApplyWindowInsetsListener((view,insets) -> { view.setPadding(dp(24),Math.max(dp(32),insets.getSystemWindowInsetTop()+dp(12)),dp(24),Math.max(dp(24),insets.getSystemWindowInsetBottom())); return insets; });
        text(content,"certiva",36,true); text(content,"Tu aliado contra el fraude · PILOTO",12,false);
        Button protection = button(content,"Protección de WhatsApp y alertas",true);
        protection.setOnClickListener(v -> startActivity(new android.content.Intent(this,ProtectionActivity.class)));
        text(content,"Activa las alertas para revisar mensajes mientras usas tu teléfono.",13,false);
        text(content,"Antes de responder, verifica.",30,true);
        text(content,"Pega un mensaje o compártelo desde otra app. El análisis de texto ocurre en este dispositivo.",16,false);
        channel = new Spinner(this); channel.setAdapter(new ArrayAdapter<>(this,android.R.layout.simple_spinner_dropdown_item,new String[]{"WhatsApp","SMS","Correo","Otro"})); content.addView(channel);
        text(content,"Texto del mensaje",14,true);
        message = new EditText(this); message.setHint("No ingreses contraseñas ni códigos privados"); message.setMinLines(5); message.setMaxLines(8); message.setGravity(android.view.Gravity.TOP); message.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_MULTI_LINE); message.setBackgroundColor(Color.WHITE); message.setPadding(dp(12),dp(12),dp(12),dp(12)); message.setContentDescription("Texto del mensaje"); content.addView(message);
        Button example = button(content,"Probar un mensaje de ejemplo",false); example.setOnClickListener(v -> message.setText("Su cuenta será bloqueada hoy. Envíe el código de verificación para desbloquearla."));
        analyze = button(content,"Verificar mensaje",true); analyze.setEnabled(false); analyze.setOnClickListener(v -> analyze());
        status = text(content,"Iniciando motor local…",12,false);
        resultBox = new LinearLayout(this); resultBox.setOrientation(LinearLayout.VERTICAL); content.addView(resultBox);
        account = button(content,"Ingresar para reportar",false); account.setOnClickListener(v -> { if(api.loggedIn) new AlertDialog.Builder(this).setTitle("Sesión de cliente").setMessage("¿Quieres cerrar la sesión de reportes?").setPositiveButton("Cerrar sesión",(d,w)->api.request("logout","POST",null,(r,e)-> { if(!alive)return; if(e!=null)error(e); else { account.setText("Ingresar para reportar"); message.setText(""); }})).setNegativeButton("Volver",null).show(); else login(); });
        Button reports = button(content,"Mis reportes",false); reports.setOnClickListener(v -> reports());
        text(content,"Prueba técnica. Caja de Ahorros es referencia; no hay conexión con el banco ni intervención en pagos. Android v0.2 analiza texto y notificaciones con reglas locales; no incluye OCR ni QVAC.",12,false);
        message.addTextChangedListener(new TextWatcher(){ public void beforeTextChanged(CharSequence s,int start,int count,int after){} public void onTextChanged(CharSequence s,int start,int before,int count){invalidate();} public void afterTextChanged(Editable e){} });
        channel.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener(){ public void onNothingSelected(android.widget.AdapterView<?> p){} public void onItemSelected(android.widget.AdapterView<?> p,View v,int pos,long id){invalidate();} });
        try { engine = new CertivaEngine(this,(r,e)-> { if(!alive)return; analyze.setEnabled(e==null); status.setText(e==null ? "Reglas locales · Configuración firmada de desarrollo" : e);
            if(pendingProtectionId!=null){
                JSONObject saved=ProtectionStore.get(this,pendingProtectionId);pendingProtectionId=null;
                if(saved!=null){renderAssessment(saved);content.post(()->scroll.smoothScrollTo(0,resultBox.getTop()));}
                else error("La alerta ya no está disponible en este teléfono");
            } }); }
        catch(Exception e){ status.setText("No se pudo verificar la configuración del SDK"); }
        if(android.content.Intent.ACTION_SEND.equals(getIntent().getAction())) { String shared = getIntent().getStringExtra(android.content.Intent.EXTRA_TEXT); if(shared!=null) message.setText(shared); }
    }
    private void invalidate(){ if(pendingProtectionId!=null)return; revision++; assessment=null; if(resultBox!=null)resultBox.removeAllViews(); }
    private int dp(int value){return Math.round(value*getResources().getDisplayMetrics().density);}
    private TextView text(LinearLayout parent,String value,int size,boolean bold){TextView view=new TextView(this);view.setText(value);view.setTextSize(size);view.setTextColor(ink);view.setPadding(0,dp(8),0,dp(8));if(bold)view.setTypeface(Typeface.DEFAULT,Typeface.BOLD);parent.addView(view);return view;}
    private Button button(LinearLayout parent,String label,boolean primary){Button view=new Button(this);view.setText(label);view.setAllCaps(false);view.setTextColor(primary?Color.WHITE:blue);if(primary)view.setBackgroundTintList(android.content.res.ColorStateList.valueOf(blue));parent.addView(view,new LinearLayout.LayoutParams(-1,dp(54)));ProtectionStyle.button(view,primary);return view;}
    private void analyze(){
        if(engine==null)return; int current=revision; analyze.setEnabled(false);
        String[] channels={"whatsapp","sms","correo","otro"};
        engine.assess(message.getText().toString(),channels[channel.getSelectedItemPosition()],(result,error)->{
            if(!alive)return; analyze.setEnabled(true); if(current!=revision)return;
            if(error!=null){error(error);return;} renderAssessment(result);
        });
    }
    private void renderAssessment(JSONObject result){
        assessment=result;resultBox.removeAllViews();
        text(resultBox,result.optString("title"),23,true);
        var reasons=result.optJSONArray("reasons"); if(reasons!=null)for(int i=0;i<reasons.length();i++)text(resultBox,"• "+reasons.optJSONObject(i).optString("title"),15,false);
        text(resultBox,result.optString("action"),16,false);
        text(resultBox,"No autentica al remitente. Cobertura: reglas de texto.",12,false);
        Button report=button(resultBox,"Revisar datos y reportar",false);report.setOnClickListener(v->preview(report));
    }
    private void preview(Button report){
        if(assessment==null)return;if(!api.loggedIn){login();return;}
        JSONObject snapshot=assessment;
        new AlertDialog.Builder(this).setTitle("Confirma tu reporte").setMessage("Se enviarán el canal, los motivos, el resultado, la fecha y las versiones del análisis.\n\nNo se enviarán texto, enlaces, números ni imágenes.\n\n"+snapshot.optString("title"))
            .setNegativeButton("Volver",null).setPositiveButton("Confirmar y enviar",(d,w)->{
                report.setEnabled(false);
                try { api.request("cases","POST",CertivaEngine.report(snapshot,true),(result,error)->{if(!alive)return;if(error!=null){report.setEnabled(true);error(error);}else{report.setText("Reporte recibido · "+result.optString("id").substring(0,8));}}); }
                catch(Exception e){report.setEnabled(true);error("No se pudo preparar el reporte");}
            }).show();
    }
    private void login(){
        LinearLayout form=new LinearLayout(this);form.setOrientation(LinearLayout.VERTICAL);form.setPadding(dp(24),dp(8),dp(24),dp(8));
        EditText name=new EditText(this);name.setHint("Usuario");name.setText("cliente");name.setSingleLine(true);form.addView(name);
        EditText password=new EditText(this);password.setHint("Contraseña");password.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD);form.addView(password);
        text(form,"Usa el acceso de cliente asignado. Para conectar por USB: adb reverse tcp:4320 tcp:4320.",12,false);
        new AlertDialog.Builder(this).setTitle("Acceso al piloto local").setView(form).setNegativeButton("Volver",null).setPositiveButton("Entrar",(d,w)->{
            try { JSONObject data=new JSONObject().put("username",name.getText().toString()).put("password",password.getText().toString());password.setText("");api.request("login","POST",data,(r,e)->{if(!alive)return;if(e!=null)error(e);else{account.setText("Cliente conectado · Cerrar sesión");status.setText("Sesión lista. Revisa los datos antes de enviar tu reporte.");}}); }
            catch(Exception e){error("Revisa tus credenciales");}
        }).show();
    }
    private void reports(){
        if(!api.loggedIn){login();return;}
        api.request("cases","GET",null,(result,error)->{if(!alive)return;if(error!=null){error(error);return;}StringBuilder list=new StringBuilder();var items=result.optJSONArray("cases");if(items!=null)for(int i=0;i<items.length();i++){var item=items.optJSONObject(i);list.append("Caso ").append(item.optString("id").substring(0,8)).append(" · ").append(item.optString("state").replace('_',' ')).append("\n\n");}new AlertDialog.Builder(this).setTitle("Mis reportes").setMessage(list.length()==0?"Todavía no has enviado reportes.":list.toString()).setPositiveButton("Cerrar",null).show();});
    }
    private void error(String message){if(alive)new AlertDialog.Builder(this).setTitle("Certiva").setMessage(message).setPositiveButton("Entendido",null).show();}
    @Override protected void onDestroy(){alive=false;if(engine!=null)engine.close();api.close();super.onDestroy();}
}
