package local.certiva.pilot;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.graphics.Color;
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
    private ScrollView scroll;
    private TextView protectionTitle, protectionSummary;
    private Button protectionAction;
    private boolean engineReady, analyzing;
    private EditText message;
    private Spinner channel;
    private Button analyze, account;
    private TextView status;
    private CertivaLocalEngine engine;
    private JSONObject assessment;
    private final PilotAPI api = new PilotAPI();
    private int revision;
    private boolean alive = true;
    private String pendingProtectionId;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        pendingProtectionId=getIntent().getStringExtra("protection_assessment_id");
        final boolean openAtTop=pendingProtectionId==null&&!android.content.Intent.ACTION_SEND.equals(getIntent().getAction());
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE|WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_HIDDEN);
        scroll = new ScrollView(this); scroll.setFillViewport(true);scroll.setBackgroundColor(ProtectionStyle.SURFACE);
        content = new LinearLayout(this); content.setOrientation(LinearLayout.VERTICAL);content.setPadding(dp(20),dp(12),dp(20),dp(20));scroll.setPadding(0,dp(36),0,0);scroll.setClipToPadding(true);
        content.setFocusableInTouchMode(true);content.requestFocus();scroll.addView(content);setContentView(scroll);ProtectionStyle.bars(this);
        scroll.setOnApplyWindowInsetsListener((view,insets)->{var bars=insets.getInsets(android.view.WindowInsets.Type.systemBars());view.setPadding(bars.left,bars.top,bars.right,Math.max(bars.bottom,insets.getInsets(android.view.WindowInsets.Type.ime()).bottom));return insets;});
        if(openAtTop)scroll.getViewTreeObserver().addOnPreDrawListener(new android.view.ViewTreeObserver.OnPreDrawListener(){
            public boolean onPreDraw(){scroll.getViewTreeObserver().removeOnPreDrawListener(this);scroll.scrollTo(0,0);return true;}
        });
        brandHeader();
        TextView heading=text(content,"Antes de responder,\nverifica.",28,true);heading.setPadding(0,dp(14),0,dp(16));

        LinearLayout protection=ProtectionStyle.card(content,ProtectionStyle.TONAL);
        TextView eyebrow=text(protection,"MI PROTECCIÓN",11,true);eyebrow.setTextColor(blue);eyebrow.setLetterSpacing(.1f);
        protectionTitle=text(protection,"Prepara tu teléfono",20,true);
        protectionSummary=text(protection,"Configura la revisión de notificaciones de WhatsApp.",14,false);
        protectionAction=button(protection,"Configurar protección",false);
        protectionAction.setBackground(new android.graphics.drawable.RippleDrawable(android.content.res.ColorStateList.valueOf(0x20205094),ProtectionStyle.shape(Color.WHITE,dp(24)),null));
        protectionAction.setOnClickListener(v->startActivity(new android.content.Intent(this,ProtectionActivity.class)));

        LinearLayout verifier=ProtectionStyle.card(content,Color.WHITE);
        text(verifier,"Revisar un mensaje",21,true);
        text(verifier,"Si algo te hace dudar, revísalo aquí.",14,false);
        LinearLayout channelRow=new LinearLayout(this);channelRow.setGravity(android.view.Gravity.CENTER_VERTICAL);verifier.addView(channelRow);
        TextView channelLabel=text(channelRow,"Recibido por",13,false);channelLabel.setPadding(0,dp(8),dp(12),dp(8));
        channel = new Spinner(this);channel.setContentDescription("Canal del mensaje");channel.setMinimumHeight(dp(48));channel.setAdapter(new ArrayAdapter<>(this,android.R.layout.simple_spinner_dropdown_item,new String[]{"WhatsApp","SMS","Correo","Otro"}));channelRow.addView(channel,new LinearLayout.LayoutParams(0,-2,1));
        message=new EditText(this);message.setHint("Pega aquí el mensaje…");message.setMinLines(3);message.setMaxLines(6);message.setGravity(android.view.Gravity.TOP);message.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_FLAG_MULTI_LINE);
        var field=ProtectionStyle.shape(ProtectionStyle.SURFACE,dp(16));field.setStroke(dp(1),0xffdce4ef);message.setBackground(field);message.setTextColor(ink);message.setHintTextColor(ProtectionStyle.MUTED);message.setTextSize(16);message.setPadding(dp(14),dp(14),dp(14),dp(14));message.setContentDescription("Texto del mensaje");verifier.addView(message,new LinearLayout.LayoutParams(-1,-2));
        text(verifier,"Evita incluir contraseñas o códigos privados.",12,false);
        LinearLayout actions=new LinearLayout(this);actions.setGravity(android.view.Gravity.CENTER_VERTICAL);verifier.addView(actions);
        Button example=button(actions,"Usar ejemplo",false);example.setLayoutParams(new LinearLayout.LayoutParams(0,-2,1));example.setOnClickListener(v->message.setText("Su cuenta será bloqueada hoy. Envíe el código de verificación para desbloquearla."));
        analyze=button(actions,"Verificar mensaje",true);var primaryParams=new LinearLayout.LayoutParams(0,-2,1.3f);primaryParams.leftMargin=dp(8);analyze.setLayoutParams(primaryParams);analyze.setEnabled(false);analyze.setOnClickListener(v->analyze());
        status=text(verifier,"Preparando verificación…",12,false);status.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE);
        resultBox=ProtectionStyle.card(content,Color.WHITE);resultBox.setVisibility(View.GONE);resultBox.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE);

        text(content,"Tus reportes",18,true);
        text(content,"Consulta lo que compartiste con el equipo del piloto.",13,false);
        LinearLayout reportActions=new LinearLayout(this);content.addView(reportActions);
        account=button(reportActions,"Ingresar",false);account.setLayoutParams(new LinearLayout.LayoutParams(0,-2,1));
        account.setOnClickListener(v->{if(api.loggedIn)new AlertDialog.Builder(this).setTitle("Sesión de cliente").setMessage("¿Quieres cerrar la sesión de reportes?").setPositiveButton("Cerrar sesión",(d,w)->api.request("logout","POST",null,(r,e)->{if(!alive)return;if(e!=null)error(e);else{account.setText("Ingresar");message.setText("");}})).setNegativeButton("Volver",null).show();else login();});
        Button reports=button(reportActions,"Mis reportes",false);var reportsParams=new LinearLayout.LayoutParams(0,-2,1);reportsParams.leftMargin=dp(8);reports.setLayoutParams(reportsParams);reports.setOnClickListener(v->reports());
        LinearLayout settings=ProtectionStyle.card(content,Color.WHITE);
        Button model=button(settings,"IA en este teléfono",false);model.setOnClickListener(v->startActivity(new android.content.Intent(this,local.certiva.qvac.ModelActivity.class)));
        ProtectionStyle.disclosure(settings,"Acerca de Certiva","Tu aliado contra el fraude. La verificación ocurre en este teléfono. QVAC requiere instalar el modelo local. Enviar reportes es opcional. Este piloto no está conectado al banco y no interviene en pagos ni modifica accesos.");
        message.addTextChangedListener(new TextWatcher(){ public void beforeTextChanged(CharSequence s,int start,int count,int after){} public void onTextChanged(CharSequence s,int start,int before,int count){invalidate();} public void afterTextChanged(Editable e){} });
        channel.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener(){ public void onNothingSelected(android.widget.AdapterView<?> p){} public void onItemSelected(android.widget.AdapterView<?> p,View v,int pos,long id){invalidate();} });
        try { engine = new CertivaLocalEngine(this,(r,e)-> { if(!alive)return; engineReady=e==null;updateAnalyzeButton();status.setText(e==null ? (local.certiva.qvac.QvacRuntime.available(this)?"El análisis se realiza en este teléfono.":"IA pendiente de configurar en Mi protección.") : e);
            if(pendingProtectionId!=null){
                JSONObject saved=ProtectionStore.get(this,pendingProtectionId);pendingProtectionId=null;
                if(saved!=null){renderAssessment(saved);scrollToResult();}
                else error("La alerta ya no está disponible en este teléfono");
            } }); }
        catch(Exception e){ status.setText("No se pudo verificar la configuración del SDK"); }
        if(android.content.Intent.ACTION_SEND.equals(getIntent().getAction())) { String shared = getIntent().getStringExtra(android.content.Intent.EXTRA_TEXT); if(shared!=null){message.setText(shared);content.post(()->scroll.smoothScrollTo(0,verifier.getTop()));} }
    }
    private void invalidate(){if(pendingProtectionId!=null)return;revision++;assessment=null;if(resultBox!=null){resultBox.removeAllViews();resultBox.setVisibility(View.GONE);}updateAnalyzeButton();}
    private void updateAnalyzeButton(){if(analyze!=null){analyze.setEnabled(engineReady&&!analyzing&&message.getText().toString().trim().length()>0);analyze.setText(analyzing?"Revisando…":"Verificar mensaje");}}
    private void scrollToResult(){content.post(()->scroll.smoothScrollTo(0,resultBox.getTop()));}
    private void brandHeader(){
        LinearLayout row=new LinearLayout(this);row.setGravity(android.view.Gravity.CENTER_VERTICAL);content.addView(row);
        ImageView logo=new ImageView(this);logo.setImageResource(R.drawable.certiva_launcher);logo.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);row.addView(logo,new LinearLayout.LayoutParams(dp(52),dp(52)));
        LinearLayout wordmark=new LinearLayout(this);wordmark.setOrientation(LinearLayout.VERTICAL);wordmark.setPadding(dp(10),0,0,0);row.addView(wordmark,new LinearLayout.LayoutParams(0,-2,1));
        TextView name=text(wordmark,"certiva",29,true);name.setTextColor(blue);name.setLetterSpacing(-.04f);name.setPadding(0,0,0,dp(2));
        TextView descriptor=text(wordmark,"Tu aliado contra el fraude",11,false);descriptor.setPadding(0,0,0,0);
    }
    @Override protected void onResume(){super.onResume();refreshProtection();}
    private void refreshProtection(){
        if(protectionTitle==null)return;
        boolean model=local.certiva.qvac.QvacRuntime.available(this);
        boolean enabled=ProtectionStore.enabled(this);
        boolean access=getSystemService(android.app.NotificationManager.class).isNotificationListenerAccessGranted(new android.content.ComponentName(this,CertivaNotificationListener.class));
        boolean ready=model&&enabled&&access&&ProtectionNotifications.allowed(this)&&CertivaNotificationListener.connected;
        protectionTitle.setText(ready?"Protección habilitada":"Completa tu protección");
        protectionSummary.setText(ready?"Certiva revisa las notificaciones de WhatsApp en este teléfono.":!model?"Prepara la IA y activa las alertas de WhatsApp.":"Revisa los permisos para recibir alertas mientras usas tu teléfono.");
        protectionAction.setText(ready?"Ver protección y alertas":"Configurar protección");
    }
    private int dp(int value){return Math.round(value*getResources().getDisplayMetrics().density);}
    private TextView text(LinearLayout parent,String value,int size,boolean bold){return ProtectionStyle.text(parent,value,size,bold);}
    private Button button(LinearLayout parent,String label,boolean primary){Button view=new Button(this);view.setText(label);view.setAllCaps(false);view.setTextColor(primary?Color.WHITE:blue);if(primary)view.setBackgroundTintList(android.content.res.ColorStateList.valueOf(blue));parent.addView(view,new LinearLayout.LayoutParams(-1,dp(54)));ProtectionStyle.button(view,primary);view.setStateListAnimator(null);return view;}
    private void analyze(){
        if(engine==null||!engineReady||analyzing||message.getText().toString().trim().isEmpty())return;int current=revision;analyzing=true;updateAnalyzeButton();status.setText("Revisando el mensaje en este teléfono…");
        ((android.view.inputmethod.InputMethodManager)getSystemService(INPUT_METHOD_SERVICE)).hideSoftInputFromWindow(message.getWindowToken(),0);message.clearFocus();
        String[] channels={"whatsapp","sms","correo","otro"};
        engine.assess(message.getText().toString(),channels[channel.getSelectedItemPosition()],(result,error)->{
            if(!alive)return;analyzing=false;updateAnalyzeButton();status.setText(error==null?"Revisión terminada.":"No se pudo completar la revisión.");if(current!=revision)return;
            if(error!=null){error(error);return;}renderAssessment(result);scrollToResult();
        });
    }
    private void renderAssessment(JSONObject result){
        assessment=result;resultBox.removeAllViews();resultBox.setVisibility(View.VISIBLE);
        text(resultBox,result.optString("title"),23,true);
        if("unavailable".equals(result.optString("aiStatus")))text(resultBox,"IA no disponible. Esta alerta se basa en reglas de texto locales.",14,false);
        var reasons=result.optJSONArray("reasons"); if(reasons!=null)for(int i=0;i<reasons.length();i++)text(resultBox,"• "+reasons.optJSONObject(i).optString("title"),15,false);
        text(resultBox,result.optString("action"),16,false);
        text(resultBox,"No autentica al remitente. Cobertura: "+result.optString("coverage"),12,false);
        if(result.has("aiModel"))text(resultBox,result.optString("aiModel")+" · Android · "+result.optLong("aiElapsedMs")+" ms",12,false);
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
        text(form,"Usa el acceso de cliente asignado. Enviar reportes es opcional y requiere conexión al servicio del piloto; el análisis y las alertas funcionan en tu teléfono.",12,false);
        new AlertDialog.Builder(this).setTitle("Acceso al piloto local").setView(form).setNegativeButton("Volver",null).setPositiveButton("Entrar",(d,w)->{
            try { JSONObject data=new JSONObject().put("username",name.getText().toString()).put("password",password.getText().toString());password.setText("");api.request("login","POST",data,(r,e)->{if(!alive)return;if(e!=null)error(e);else{account.setText("Cerrar sesión");status.setText("Sesión lista. Revisa los datos antes de enviar tu reporte.");}}); }
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
