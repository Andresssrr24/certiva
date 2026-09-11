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
    private LinearLayout content, resultBox, homePage, verifyPage, alertsPage, menuPage, recentAlerts, navigation;
    private final LinearLayout[] pages = new LinearLayout[4];
    private final TextView[] navLabels = new TextView[4];
    private final LinearLayout[] navItems = new LinearLayout[4];
    private final ImageView[] navIcons = new ImageView[4];
    private final int[] pageScroll = new int[4];
    private int selectedPage;
    private boolean backCallbackRegistered;
    private final android.window.OnBackInvokedCallback navigateHome = () -> selectPage(0);
    private TextView setupProgress, alertCount, accountSummary;
    private ProgressBar setupBar;
    private android.content.SharedPreferences.OnSharedPreferenceChangeListener protectionChanges;
    private final Runnable refreshOnScreen = () -> { if(this.alive) { refreshProtection(); refreshAlerts(); } };
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
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE|WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_HIDDEN);
        LinearLayout shell=new LinearLayout(this);shell.setOrientation(LinearLayout.VERTICAL);shell.setBackgroundColor(ProtectionStyle.SURFACE);
        scroll = new ScrollView(this); scroll.setFillViewport(true);scroll.setClipToPadding(true);
        content = new LinearLayout(this); content.setOrientation(LinearLayout.VERTICAL);content.setPadding(dp(20),dp(12),dp(20),dp(24));
        content.setFocusableInTouchMode(true);content.requestFocus();scroll.addView(content);shell.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));setContentView(shell);ProtectionStyle.bars(this);
        shell.setOnApplyWindowInsetsListener((view,insets)->{var bars=insets.getInsets(android.view.WindowInsets.Type.systemBars());view.setPadding(bars.left,bars.top,bars.right,Math.max(bars.bottom,insets.getInsets(android.view.WindowInsets.Type.ime()).bottom));return insets;});
        brandHeader();
        for(int i=0;i<pages.length;i++){pages[i]=new LinearLayout(this);pages[i].setOrientation(LinearLayout.VERTICAL);content.addView(pages[i]);}
        homePage=pages[0];verifyPage=pages[1];alertsPage=pages[2];menuPage=pages[3];
        buildHome();
        text(verifyPage,"Revisar un mensaje",27,true);
        text(verifyPage,"Tómate un momento antes de responder.",14,false);
        LinearLayout verifier=ProtectionStyle.card(verifyPage,Color.WHITE);
        text(verifier,"¿Qué recibiste?",20,true);
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
        resultBox=ProtectionStyle.card(verifyPage,Color.WHITE);resultBox.setVisibility(View.GONE);resultBox.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE);

        buildMenu();
        buildNavigation(shell);
        message.addTextChangedListener(new TextWatcher(){ public void beforeTextChanged(CharSequence s,int start,int count,int after){} public void onTextChanged(CharSequence s,int start,int before,int count){invalidate();} public void afterTextChanged(Editable e){} });
        channel.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener(){ public void onNothingSelected(android.widget.AdapterView<?> p){} public void onItemSelected(android.widget.AdapterView<?> p,View v,int pos,long id){invalidate();} });
        try { engine = new CertivaLocalEngine(this,(r,e)-> { if(!alive)return; engineReady=e==null;updateAnalyzeButton();status.setText(e==null ? (local.certiva.qvac.QvacRuntime.available(this)?"El análisis se realiza en este teléfono.":"IA pendiente de configurar en Mi protección.") : e);
            if(pendingProtectionId!=null){
                JSONObject saved=ProtectionStore.get(this,pendingProtectionId);pendingProtectionId=null;
                if(saved!=null){renderAssessment(saved);scrollToResult();}
                else error("La alerta ya no está disponible en este teléfono");
            } }); }
        catch(Exception e){ status.setText("No se pudo verificar la configuración del SDK"); }
        int initial=state==null?0:state.getInt("selectedPage",0);
        if(state!=null){message.setText(state.getString("draft",""));channel.setSelection(state.getInt("channel",0));}
        if(android.content.Intent.ACTION_SEND.equals(getIntent().getAction())) {
            String shared=getIntent().getStringExtra(android.content.Intent.EXTRA_TEXT);
            if(state==null&&shared!=null)message.setText(shared);
            if(state==null)initial=1;
        }
        if(pendingProtectionId!=null)initial=1;
        selectPage(initial);
        protectionChanges=(prefs,key)->{scroll.removeCallbacks(refreshOnScreen);scroll.post(refreshOnScreen);};
        ProtectionStore.prefs(this).registerOnSharedPreferenceChangeListener(protectionChanges);
    }
    private void buildHome(){
        TextView welcome=text(homePage,"TU TRANQUILIDAD, PRIMERO",11,true);welcome.setTextColor(blue);welcome.setLetterSpacing(.1f);welcome.setPadding(0,dp(22),0,dp(4));
        LinearLayout hero=ProtectionStyle.card(homePage,blue);
        TextView title=text(hero,"Antes de responder,\nverifica.",30,true);title.setTextColor(Color.WHITE);
        TextView subtitle=text(hero,"Un mensaje sospechoso. Un momento para revisar.",15,false);subtitle.setTextColor(0xffe6efff);
        Button review=button(hero,"Revisar un mensaje",false);review.setBackground(new android.graphics.drawable.RippleDrawable(android.content.res.ColorStateList.valueOf(0x20205094),ProtectionStyle.shape(Color.WHITE,dp(26)),null));review.setOnClickListener(v->selectPage(1));
        TextView privateLabel=text(hero,"Análisis en tu teléfono · Reportes opcionales",11,false);privateLabel.setTextColor(0xffe6efff);
        LinearLayout protection=ProtectionStyle.card(homePage,Color.WHITE);
        TextView eyebrow=text(protection,"MI PROTECCIÓN",11,true);eyebrow.setTextColor(blue);eyebrow.setLetterSpacing(.1f);
        protectionTitle=text(protection,"Prepara tu teléfono",21,true);
        protectionSummary=text(protection,"Configura la revisión de notificaciones de WhatsApp.",14,false);
        setupBar=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);setupBar.setMax(5);setupBar.setProgressTintList(android.content.res.ColorStateList.valueOf(blue));setupBar.setProgressBackgroundTintList(android.content.res.ColorStateList.valueOf(ProtectionStyle.TONAL));protection.addView(setupBar,new LinearLayout.LayoutParams(-1,dp(6)));
        setupProgress=text(protection,"",12,false);
        protectionAction=button(protection,"Configurar protección",false);protectionAction.setOnClickListener(v->openProtection());
        text(homePage,"A tu alcance",19,true);
        LinearLayout shortcuts=new LinearLayout(this);homePage.addView(shortcuts);
        quickAction(shortcuts,"report","Mis reportes","Consulta tus envíos",this::reports);
        quickAction(shortcuts,"help","Cómo usar Certiva","Una guía rápida",this::showGuide);
        LinearLayout recentHeader=new LinearLayout(this);recentHeader.setGravity(android.view.Gravity.CENTER_VERTICAL);homePage.addView(recentHeader);
        TextView recent=text(recentHeader,"Actividad reciente",19,true);recent.setLayoutParams(new LinearLayout.LayoutParams(0,-2,1));
        alertCount=text(recentHeader,"",12,false);
        recentAlerts=new LinearLayout(this);recentAlerts.setOrientation(LinearLayout.VERTICAL);homePage.addView(recentAlerts);
    }
    private void quickAction(LinearLayout parent,String icon,String title,String detail,Runnable action){
        LinearLayout tile=ProtectionStyle.card(parent,Color.WHITE);LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(0,-1,1);params.setMargins(0,dp(6),parent.getChildCount()==1?dp(10):0,dp(14));tile.setLayoutParams(params);tile.setPadding(dp(14),dp(16),dp(14),dp(14));
        addIcon(tile,icon,blue,26);text(tile,title,14,true).setTextColor(ink);text(tile,detail,12,false);makeAction(tile,title+". "+detail,action);
    }
    private void buildMenu(){
        text(menuPage,"Tu espacio",28,true);text(menuPage,"Ajusta Certiva a tu día a día.",14,false);
        LinearLayout profile=ProtectionStyle.card(menuPage,blue);
        TextView profileTitle=text(profile,"Tu cuenta de reportes",21,true);profileTitle.setTextColor(Color.WHITE);
        accountSummary=text(profile,"Ingresa para consultar los casos que compartes con el equipo del piloto.",14,false);accountSummary.setTextColor(0xffe6efff);
        account=button(profile,"Ingresar",false);
        account.setOnClickListener(v->{if(api.loggedIn)new AlertDialog.Builder(this).setTitle("Sesión de cliente").setMessage("¿Quieres cerrar la sesión de reportes?").setPositiveButton("Cerrar sesión",(d,w)->api.request("logout","POST",null,(r,e)->{if(!alive)return;if(e!=null)error(e);else{account.setText("Ingresar");accountSummary.setText("Ingresa para consultar los casos que compartes con el equipo del piloto.");message.setText("");}})).setNegativeButton("Volver",null).show();else login();});
        text(menuPage,"PROTECCIÓN Y ACTIVIDAD",11,true).setTextColor(blue);
        LinearLayout settings=ProtectionStyle.card(menuPage,Color.WHITE);
        menuAction(settings,"shield","Mi protección","Permisos y revisión de WhatsApp",this::openProtection);
        menuAction(settings,"bell","Alertas guardadas","Resultados de los últimos 7 días",()->selectPage(2));
        menuAction(settings,"report","Mis reportes","Casos compartidos con el piloto",this::reports);
        menuAction(settings,"spark","IA en este teléfono","Modelo local y configuración",()->startActivity(new android.content.Intent(this,local.certiva.qvac.ModelActivity.class)));
        text(menuPage,"AYUDA Y PRIVACIDAD",11,true).setTextColor(blue);
        LinearLayout help=ProtectionStyle.card(menuPage,Color.WHITE);
        menuAction(help,"help","Cómo usar Certiva","De un mensaje a una decisión",this::showGuide);
        menuAction(help,"lock","Tus datos y privacidad","Qué se guarda y qué se comparte",()->info("Tus datos y privacidad","La revisión ocurre en este teléfono. Certiva procesa el texto visible de notificaciones de WhatsApp y WhatsApp Business si lo autorizas.\n\nGuarda hasta 20 resultados durante 7 días, sin el mensaje original, remitente, enlaces ni códigos. Puedes borrarlos en Mi protección.\n\nLos reportes requieren tu confirmación. Se envían por HTTPS al servicio de Certiva, vinculados a tu cuenta, sin el texto del mensaje. Puedes borrarlos desde Mis reportes."));
        menuAction(help,"info","Acerca de Certiva","Tu aliado contra el fraude",()->info("Acerca de Certiva","Antes de responder, verifica.\n\nEste piloto no está conectado al banco y no interviene en pagos ni modifica accesos. QVAC en Android sigue en fase experimental; instalar un modelo no acredita su funcionamiento. Si la IA no está disponible, los resultados lo indican.\n\nVersión "+versionName()));
        text(menuPage,"Certiva · Piloto experimental",12,false).setGravity(android.view.Gravity.CENTER);
    }
    private String versionName(){try{return getPackageManager().getPackageInfo(getPackageName(),0).versionName;}catch(Exception ignored){return "experimental";}}
    private void info(String title,String body){new AlertDialog.Builder(this).setTitle(title).setMessage(body).setPositiveButton("Entendido",null).show();}
    private void showGuide(){info("Cómo usar Certiva","1. Revisa un mensaje\nCopia el mensaje o compártelo desde otra app hacia Certiva. Elige su canal y toca Verificar mensaje.\n\n2. Lee las señales\nRevisa los motivos y la acción sugerida. El resultado no confirma la identidad del remitente.\n\n3. Prepara las alertas\nAbre Mi protección para configurar la IA y los permisos de WhatsApp.\n\n4. Decide si reportar\nPuedes ingresar al piloto, revisar los datos y confirmar el envío. Reportar es opcional.");}
    private void openProtection(){startActivity(new android.content.Intent(this,ProtectionActivity.class));}
    private void menuAction(LinearLayout parent,String icon,String title,String detail,Runnable action){
        LinearLayout row=new LinearLayout(this);row.setGravity(android.view.Gravity.CENTER_VERTICAL);row.setPadding(0,dp(12),0,dp(12));parent.addView(row,new LinearLayout.LayoutParams(-1,-2));addIcon(row,icon,blue,24);
        LinearLayout copy=new LinearLayout(this);copy.setOrientation(LinearLayout.VERTICAL);copy.setPadding(dp(14),0,dp(8),0);row.addView(copy,new LinearLayout.LayoutParams(0,-2,1));
        TextView label=text(copy,title,15,true);label.setPadding(0,0,0,dp(4));TextView note=text(copy,detail,12,false);note.setPadding(0,0,0,0);addIcon(row,"arrow",ProtectionStyle.MUTED,18);makeAction(row,title+". "+detail,action);
    }
    private void makeAction(LinearLayout row,String label,Runnable action){
        row.setMinimumHeight(dp(56));row.setFocusable(true);row.setClickable(true);row.setContentDescription(label);
        row.setAccessibilityDelegate(new View.AccessibilityDelegate(){@Override public void onInitializeAccessibilityNodeInfo(View host,android.view.accessibility.AccessibilityNodeInfo info){super.onInitializeAccessibilityNodeInfo(host,info);info.setClassName(Button.class.getName());}});
        for(int i=0;i<row.getChildCount();i++)row.getChildAt(i).setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS);
        row.setForeground(new android.graphics.drawable.RippleDrawable(android.content.res.ColorStateList.valueOf(0x18205094),null,ProtectionStyle.shape(Color.WHITE,dp(18))));row.setOnClickListener(v->action.run());
    }
    private ImageView addIcon(LinearLayout parent,String icon,int color,int size){ImageView view=new ImageView(this);view.setImageDrawable(new NavigationIcon(icon,color));view.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);parent.addView(view,new LinearLayout.LayoutParams(dp(size),dp(size)));return view;}
    private void buildNavigation(LinearLayout shell){
        View line=new View(this);line.setBackgroundColor(0xffe4eaf3);shell.addView(line,new LinearLayout.LayoutParams(-1,dp(1)));
        LinearLayout nav=new LinearLayout(this);navigation=nav;
        // Keep this small persistent bar in one layer when page visibility changes.
        // This also avoids stale child display lists on Android's emulator renderer.
        nav.setLayerType(View.LAYER_TYPE_SOFTWARE,null);
        nav.setGravity(android.view.Gravity.CENTER_VERTICAL);nav.setPadding(dp(10),dp(6),dp(10),dp(6));nav.setBackgroundColor(Color.WHITE);shell.addView(nav,new LinearLayout.LayoutParams(-1,-2));
        String[] titles={"Inicio","Verificar","Alertas","Menú"},icons={"home","scan","bell","menu"};
        for(int i=0;i<4;i++){
            final int page=i;LinearLayout item=new LinearLayout(this);item.setOrientation(LinearLayout.VERTICAL);item.setGravity(android.view.Gravity.CENTER);item.setPadding(dp(4),dp(8),dp(4),dp(6));nav.addView(item,new LinearLayout.LayoutParams(0,-2,1));
            navIcons[i]=addIcon(item,icons[i],blue,22);navLabels[i]=text(item,titles[i],11,true);navLabels[i].setPadding(0,dp(5),0,0);navLabels[i].setGravity(android.view.Gravity.CENTER);
            makeAction(item,titles[i],()->selectPage(page));navItems[i]=item;
        }
    }
    private void selectPage(int index){
        int next=Math.max(0,Math.min(3,index));pageScroll[selectedPage]=scroll.getScrollY();selectedPage=next;
        if(next!=0&&!backCallbackRegistered){
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,navigateHome);
            backCallbackRegistered=true;
        }else if(next==0&&backCallbackRegistered){
            getOnBackInvokedDispatcher().unregisterOnBackInvokedCallback(navigateHome);
            backCallbackRegistered=false;
        }
        String[] icons={"home","scan","bell","menu"};
        for(int i=0;i<pages.length;i++){pages[i].setVisibility(i==next?View.VISIBLE:View.GONE);if(navItems[i]!=null){navItems[i].setSelected(i==next);navItems[i].setBackground(ProtectionStyle.shape(i==next?ProtectionStyle.TONAL:Color.WHITE,dp(18)));navLabels[i].setTextColor(i==next?blue:ProtectionStyle.MUTED);navIcons[i].setImageDrawable(new NavigationIcon(icons[i],i==next?blue:ProtectionStyle.MUTED));}}
        for(int i=0;i<navItems.length;i++){if(navItems[i]!=null){navIcons[i].invalidate();navLabels[i].invalidate();navItems[i].invalidate();}}
        if(navigation!=null)navigation.invalidate();
        if(next!=1&&message!=null){message.clearFocus();((android.view.inputmethod.InputMethodManager)getSystemService(INPUT_METHOD_SERVICE)).hideSoftInputFromWindow(message.getWindowToken(),0);}
        content.requestFocus();int position=pageScroll[next];scroll.post(()->scroll.scrollTo(0,position));
    }
    private void refreshAlerts(){
        if(recentAlerts==null)return;
        var items=ProtectionStore.alerts(this);alertCount.setText(items.length()==1?"1 alerta":items.length()+" alertas");recentAlerts.removeAllViews();alertsPage.removeAllViews();
        text(alertsPage,"Tus alertas",28,true);text(alertsPage,"Resultados guardados en este teléfono.",14,false);
        if(items.length()==0){
            emptyAlerts(recentAlerts,false);emptyAlerts(alertsPage,true);
        }else{
            for(int i=0;i<items.length();i++){JSONObject item=items.optJSONObject(i);if(item==null)continue;alertCard(alertsPage,item);if(i==0)alertCard(recentAlerts,item);}
            button(recentAlerts,"Ver todas las alertas",false).setOnClickListener(v->selectPage(2));
        }
        text(alertsPage,"Hasta 20 resultados durante 7 días. No se guarda el texto de tus mensajes.",12,false);
        button(alertsPage,"Gestionar protección",false).setOnClickListener(v->openProtection());
    }
    private void emptyAlerts(LinearLayout parent,boolean full){
        LinearLayout empty=ProtectionStyle.card(parent,Color.WHITE);if(full)ProtectionStyle.shield(empty);
        text(empty,"Todavía no hay alertas",full?21:17,true);text(empty,"Cuando Certiva detecte señales de riesgo en una notificación, podrás consultarlas aquí.",14,false);
        if(full){text(empty,"No tener alertas no confirma que la protección esté activa. Comprueba su estado en Mi protección.",12,false);button(empty,"Revisar un mensaje ahora",true).setOnClickListener(v->selectPage(1));}
    }
    private void alertCard(LinearLayout parent,JSONObject item){
        LinearLayout card=ProtectionStyle.card(parent,Color.WHITE);
        String date=java.text.DateFormat.getDateTimeInstance(java.text.DateFormat.SHORT,java.text.DateFormat.SHORT).format(new java.util.Date(item.optLong("receivedAt")));
        text(card,item.optString("channel","WhatsApp")+" · "+date,12,false);text(card,item.optString("title","Resultado guardado"),18,true);
        if("unavailable".equals(item.optString("aiStatus")))text(card,"Revisión con reglas locales · IA no disponible",12,false);
        text(card,"Ver señales y pasos recomendados  →",13,true).setTextColor(blue);
        makeAction(card,item.optString("title")+". "+date+". Ver detalle",()->startActivity(new android.content.Intent(this,ProtectionDetailActivity.class).putExtra("alert_id",item.optString("id"))));
    }
    @Override protected void onSaveInstanceState(Bundle out){super.onSaveInstanceState(out);out.putInt("selectedPage",selectedPage);out.putString("draft",message.getText().toString());out.putInt("channel",channel.getSelectedItemPosition());}
    private void invalidate(){if(pendingProtectionId!=null)return;revision++;assessment=null;if(resultBox!=null){resultBox.removeAllViews();resultBox.setVisibility(View.GONE);}updateAnalyzeButton();}
    private void updateAnalyzeButton(){if(analyze!=null){analyze.setEnabled(engineReady&&!analyzing&&message.getText().toString().trim().length()>0);analyze.setText(analyzing?"Revisando…":"Verificar mensaje");}}
    private void scrollToResult(){selectPage(1);content.post(()->scroll.smoothScrollTo(0,verifyPage.getTop()+resultBox.getTop()));}
    private void brandHeader(){
        LinearLayout row=new LinearLayout(this);row.setGravity(android.view.Gravity.CENTER_VERTICAL);content.addView(row);
        ImageView logo=new ImageView(this);logo.setImageResource(R.drawable.certiva_launcher);logo.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);row.addView(logo,new LinearLayout.LayoutParams(dp(52),dp(52)));
        LinearLayout wordmark=new LinearLayout(this);wordmark.setOrientation(LinearLayout.VERTICAL);wordmark.setPadding(dp(10),0,0,0);row.addView(wordmark,new LinearLayout.LayoutParams(0,-2,1));
        TextView name=text(wordmark,"certiva",29,true);name.setTextColor(blue);name.setLetterSpacing(-.04f);name.setPadding(0,0,0,dp(2));
        TextView descriptor=text(wordmark,"Tu aliado contra el fraude",11,false);descriptor.setPadding(0,0,0,0);
    }
    @Override protected void onResume(){super.onResume();refreshProtection();refreshAlerts();}
    private void refreshProtection(){
        if(protectionTitle==null)return;
        boolean model=local.certiva.qvac.QvacRuntime.available(this);
        boolean enabled=ProtectionStore.enabled(this);
        boolean access=getSystemService(android.app.NotificationManager.class).isNotificationListenerAccessGranted(new android.content.ComponentName(this,CertivaNotificationListener.class));
        boolean ready=model&&enabled&&access&&ProtectionNotifications.allowed(this)&&CertivaNotificationListener.connected;
        int complete=(model?1:0)+(enabled?1:0)+(access?1:0)+(ProtectionNotifications.allowed(this)?1:0)+(CertivaNotificationListener.connected?1:0);
        if(engineReady&&!analyzing&&assessment==null&&status!=null)status.setText(model?"El análisis se realiza en este teléfono.":"IA pendiente de configurar en Mi protección.");
        setupBar.setProgress(complete);setupProgress.setText(complete+" de 5 requisitos listos");
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
        new AlertDialog.Builder(this).setTitle("Confirma tu reporte").setMessage("Se enviarán al servicio de Certiva por HTTPS el canal, los motivos, el resultado, la fecha y las versiones del análisis, vinculados a tu cuenta.\n\nNo se enviarán texto, enlaces, números ni imágenes.\n\n"+snapshot.optString("title"))
            .setNegativeButton("Volver",null).setPositiveButton("Confirmar y enviar",(d,w)->{
                report.setEnabled(false);
                try { api.request("cases","POST",CertivaEngine.report(snapshot,true),(result,error)->{if(!alive)return;if(error!=null){report.setEnabled(true);error(error);}else{report.setText("Reporte recibido · "+result.optString("id").substring(0,8));}}); }
                catch(Exception e){report.setEnabled(true);error("No se pudo preparar el reporte");}
            }).show();
    }
    private void login(){
        LinearLayout form=new LinearLayout(this);form.setOrientation(LinearLayout.VERTICAL);form.setPadding(dp(24),dp(8),dp(24),dp(8));
        EditText name=new EditText(this);name.setHint("Usuario");name.setSingleLine(true);form.addView(name);
        EditText password=new EditText(this);password.setHint("Contraseña");password.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD);form.addView(password);
        text(form,"Usa el acceso de cliente asignado. Enviar reportes es opcional y requiere conexión al servicio del piloto; el análisis y las alertas funcionan en tu teléfono.",12,false);
        new AlertDialog.Builder(this).setTitle("Acceso a reportes").setView(form).setNegativeButton("Volver",null).setPositiveButton("Entrar",(d,w)->{
            try { JSONObject data=new JSONObject().put("username",name.getText().toString().trim()).put("password",password.getText().toString());password.setText("");api.request("login","POST",data,(r,e)->{if(!alive)return;if(e!=null)error(e);else{account.setText("Cerrar sesión");accountSummary.setText("Sesión activa. Puedes consultar tus reportes y decidir qué resultados compartir.");status.setText("Sesión lista. Revisa los datos antes de enviar tu reporte.");}}); }
            catch(Exception e){error("Revisa tus credenciales");}
        }).show();
    }
    private void reports(){
        if(!api.loggedIn){login();return;}
        api.request("cases","GET",null,(result,error)->{if(!alive)return;if(error!=null){error(error);return;}StringBuilder list=new StringBuilder();var items=result.optJSONArray("cases");if(items!=null)for(int i=0;i<items.length();i++){var item=items.optJSONObject(i);list.append("Caso ").append(item.optString("id").substring(0,8)).append(" · ").append(item.optString("state").replace('_',' ')).append("\n\n");}new AlertDialog.Builder(this).setTitle("Mis reportes").setMessage(list.length()==0?"Todavía no has enviado reportes.":list.toString()).setPositiveButton("Cerrar",null).setNeutralButton("Borrar mis reportes",(d,w)->confirmErase()).show();});
    }
    private void confirmErase(){
        new AlertDialog.Builder(this).setTitle("Borrar mis reportes").setMessage("Se eliminarán todos los reportes de tu cuenta del servicio del piloto. Esta acción no se puede deshacer.").setNegativeButton("Cancelar",null).setPositiveButton("Borrar",(d,w)->{
            try { api.request("erase","POST",new JSONObject().put("confirm",true),(r,e)->{if(!alive)return;if(e!=null)error(e);else info("Reportes borrados","Se eliminaron los reportes de tu cuenta.");}); }
            catch(Exception e){error("No se pudo preparar el borrado");}
        }).show();
    }
    private void error(String message){if(alive)new AlertDialog.Builder(this).setTitle("Certiva").setMessage(message).setPositiveButton("Entendido",null).show();}
    @Override protected void onDestroy(){alive=false;if(backCallbackRegistered){getOnBackInvokedDispatcher().unregisterOnBackInvokedCallback(navigateHome);backCallbackRegistered=false;}if(protectionChanges!=null)ProtectionStore.prefs(this).unregisterOnSharedPreferenceChangeListener(protectionChanges);if(scroll!=null)scroll.removeCallbacks(refreshOnScreen);if(engine!=null)engine.close();api.close();super.onDestroy();}
}
