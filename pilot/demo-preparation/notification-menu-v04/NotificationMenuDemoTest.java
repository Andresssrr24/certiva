package local.certiva.pilot;

import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Rect;
import android.os.ParcelFileDescriptor;
import android.service.notification.StatusBarNotification;
import android.test.InstrumentationTestCase;
import android.test.ServiceTestCase;
import android.view.View;
import android.view.ViewGroup;
import android.view.accessibility.AccessibilityNodeInfo;
import android.widget.Button;
import android.widget.TextView;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONArray;
import org.json.JSONObject;

/** Explicit emulator demo: synthetic input, production listener/engine/notification,
 * real visible notification tap, real consent and one real pilot report.
 * Kept outside androidTest until the owner of the 0.4 build grants its turn. */
public final class NotificationMenuDemoTest extends InstrumentationTestCase {
    private static final String INPUT_CHANNEL="certiva_demo_input_v1";
    private static final int INPUT_ID=7041;
    private static final String INPUT="Su cuenta será bloqueada hoy. Dígame por favor su clave y el código de verificación.";
    private final JSONObject evidence=new JSONObject();
    private final JSONArray phases=new JSONArray();
    private final ArrayList<Activity> activities=new ArrayList<>();
    private Context context;
    private long recordingStarted;

    /** ServiceTestCase attaches the production service without changing app code. */
    private static final class ListenerHarness extends ServiceTestCase<CertivaNotificationListener> {
        ListenerHarness(){super(CertivaNotificationListener.class);}
        void open(Context c)throws Exception {setContext(c);super.setUp();startService(new Intent(c,CertivaNotificationListener.class));}
        void deliver(StatusBarNotification value){getService().onNotificationPosted(value);}
        void close()throws Exception {super.tearDown();}
    }
    private void writeEvidence()throws Exception {
        Files.write(new File(context.getExternalFilesDir(null),"notification-menu-result.json").toPath(),evidence.toString(2).getBytes(StandardCharsets.UTF_8));
    }
    private void phase(String name)throws Exception {
        evidence.put("phases",phases.put(new JSONObject().put("name",name).put("at",System.currentTimeMillis()).put("recordingElapsedMs",android.os.SystemClock.elapsedRealtime()-recordingStarted)));
        writeEvidence();android.util.Log.i("CertivaMenuDemo",name);android.os.SystemClock.sleep(2200);
    }
    private String shell(String command)throws Exception {
        try(var in=new ParcelFileDescriptor.AutoCloseInputStream(getInstrumentation().getUiAutomation().executeShellCommand(command))){return new String(in.readAllBytes(),StandardCharsets.UTF_8).trim();}
    }
    private View find(View root,String label){
        if(root.isShown()&&(label.contentEquals(root.getContentDescription()==null?"":root.getContentDescription())||(root instanceof TextView&&label.equals(((TextView)root).getText().toString()))))return root;
        if(root instanceof ViewGroup)for(int i=0;i<((ViewGroup)root).getChildCount();i++){View item=find(((ViewGroup)root).getChildAt(i),label);if(item!=null)return item;}
        return null;
    }
    private Object field(Activity activity,String name)throws Exception {var f=MainActivity.class.getDeclaredField(name);f.setAccessible(true);return f.get(activity);}
    private void click(Activity activity,String label)throws Throwable {
        View target=find(activity.getWindow().getDecorView(),label);assertNotNull(label,target);
        runTestOnUiThread(()->target.requestRectangleOnScreen(new Rect(0,0,target.getWidth(),target.getHeight()),true));
        getInstrumentation().waitForIdleSync();android.os.SystemClock.sleep(350);
        runTestOnUiThread(()->assertTrue(label,target.performClick()));getInstrumentation().waitForIdleSync();
    }
    private JSONObject request(PilotAPI api,String route,String method,JSONObject data)throws Exception {
        var done=new CountDownLatch(1);var result=new AtomicReference<JSONObject>();var error=new AtomicReference<String>();
        api.request(route,method,data,(r,e)->{result.set(r);error.set(e);done.countDown();});
        assertTrue("Pilot request timeout",done.await(25,TimeUnit.SECONDS));assertNull(error.get());return result.get();
    }
    private AccessibilityNodeInfo node(AccessibilityNodeInfo root,String text,int depth){
        if(root==null||depth>24)return null;
        if(root.isVisibleToUser()&&root.getText()!=null&&text.equalsIgnoreCase(root.getText().toString()))return root;
        for(int i=0;i<root.getChildCount();i++){var found=node(root.getChild(i),text,depth+1);if(found!=null)return found;}return null;
    }
    private boolean tapSystemText(String text,boolean touch)throws Exception {
        var automation=getInstrumentation().getUiAutomation();long until=System.currentTimeMillis()+15000;
        while(System.currentTimeMillis()<until){
            for(var window:automation.getWindows()){
                var found=node(window.getRoot(),text,0);if(found==null)continue;
                if(touch){
                    Rect bounds=new Rect();found.getBoundsInScreen(bounds);if(bounds.isEmpty())continue;
                    long now=android.os.SystemClock.uptimeMillis();
                    var down=android.view.MotionEvent.obtain(now,now,0,bounds.centerX(),bounds.centerY(),0);
                    var up=android.view.MotionEvent.obtain(now,now+80,1,bounds.centerX(),bounds.centerY(),0);
                    try {down.setSource(android.view.InputDevice.SOURCE_TOUCHSCREEN);up.setSource(android.view.InputDevice.SOURCE_TOUCHSCREEN);return automation.injectInputEvent(down,true)&&automation.injectInputEvent(up,true);}finally{down.recycle();up.recycle();}
                }
                for(int i=0;found!=null&&i<4;i++,found=found.getParent())if(found.isClickable()&&found.performAction(AccessibilityNodeInfo.ACTION_CLICK))return true;
            }
            Thread.sleep(150);
        }
        return false;
    }
    @SuppressWarnings("unchecked") private void restore(SharedPreferences prefs,Map<String,?> snapshot){
        var edit=prefs.edit().clear();
        for(var item:snapshot.entrySet()){
            String k=item.getKey();Object v=item.getValue();
            if(v instanceof String)edit.putString(k,(String)v);else if(v instanceof Boolean)edit.putBoolean(k,(Boolean)v);
            else if(v instanceof Integer)edit.putInt(k,(Integer)v);else if(v instanceof Long)edit.putLong(k,(Long)v);
            else if(v instanceof Float)edit.putFloat(k,(Float)v);else if(v instanceof Set)edit.putStringSet(k,(Set<String>)v);
        }
        assertTrue("Restore original protection preferences",edit.commit());
    }
    public void testIncomingNotificationToRealReport()throws Throwable {
        context=getInstrumentation().getTargetContext();
        assertTrue("Dedicated emulator only","ranchu".equals(android.os.Build.HARDWARE)||"goldfish".equals(android.os.Build.HARDWARE));
        assertFalse("Rules fallback demo requires no installed AI model",local.certiva.qvac.QvacRuntime.available(context));
        assertTrue("Grant notification permission before this explicit demo",ProtectionNotifications.allowed(context));
        var prefs=ProtectionStore.prefs(context);Map<String,?> previous=prefs.getAll();
        var manager=context.getSystemService(NotificationManager.class);ListenerHarness harness=new ListenerHarness();boolean serviceStarted=false;
        File credentials=new File(context.getFilesDir(),"notification-menu-private.json");
        String recorder=null,assessmentId=null;ParcelFileDescriptor recordingPipe=null;PilotAPI initialApi=new PilotAPI();
        evidence.put("passed",false).put("reportSubmitted",false).put("input","Synthetic StatusBarNotification delivered to production listener; visible input is labelled Mensaje de prueba / Demo en emulador")
            .put("liveWhatsApp",false).put("physicalDevice",false).put("assessmentInjected",false).put("setupActivationValidated",false)
            .put("setupNote","Harness temporarily enables listener processing; this does not validate permission onboarding or background OS delivery")
            .put("startedAt",System.currentTimeMillis());writeEvidence();
        try {
            JSONObject login=new JSONObject(new String(Files.readAllBytes(credentials.toPath()),StandardCharsets.UTF_8));Files.delete(credentials.toPath());
            request(initialApi,"login","POST",login);assertTrue(initialApi.loggedIn);
            runTestOnUiThread(()->{try{harness.open(context);}catch(Exception e){throw new RuntimeException(e);}});serviceStarted=true;
            assertTrue(prefs.edit().putBoolean("enabled",true).commit());
            var automation=getInstrumentation().getUiAutomation();var info=automation.getServiceInfo();info.flags|=android.accessibilityservice.AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS;automation.setServiceInfo(info);
            shell("cmd statusbar collapse");
            assertTrue(automation.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_HOME));android.os.SystemClock.sleep(1200);
            assertTrue("No other recorder",shell("pidof screenrecord").isEmpty());
            String video="/sdcard/certiva-notification-menu-"+System.currentTimeMillis()+".mp4";evidence.put("remoteVideo",video);
            recordingStarted=android.os.SystemClock.elapsedRealtime();
            recordingPipe=automation.executeShellCommand("screenrecord --size 720x1600 --bit-rate 1300000 --time-limit 150 "+video);
            android.os.SystemClock.sleep(800);recorder=shell("pidof screenrecord");assertTrue("Recorder started",recorder.matches("[0-9]+"));phase("01-android-home");
            var channel=new NotificationChannel(INPUT_CHANNEL,"Mensajes de prueba",NotificationManager.IMPORTANCE_HIGH);manager.createNotificationChannel(channel);
            Notification incoming=new Notification.Builder(context,INPUT_CHANNEL).setSmallIcon(android.R.drawable.ic_dialog_email)
                .setContentTitle("Mensaje de prueba · Demo en emulador").setContentText(INPUT).setStyle(new Notification.BigTextStyle().bigText(INPUT))
                .setSubText("Entrada simulada").setAutoCancel(true).build();
            manager.notify(INPUT_ID,incoming);
            phase("02a-incoming-banner");
            assertTrue(automation.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_NOTIFICATIONS));phase("02b-visible-demo-input");
            shell("cmd statusbar collapse");
            assertTrue(automation.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_HOME));android.os.SystemClock.sleep(1200);
            var synthetic=new StatusBarNotification("com.whatsapp","com.whatsapp",INPUT_ID,"certiva-demo-"+System.currentTimeMillis(),android.os.Process.myUid(),0,0,incoming,android.os.Process.myUserHandle(),System.currentTimeMillis());
            long started=System.currentTimeMillis();runTestOnUiThread(()->harness.deliver(synthetic));
            JSONObject assessment=null;long until=started+30000;
            while(assessment==null&&System.currentTimeMillis()<until){
                var items=ProtectionStore.alerts(context);
                for(int i=0;i<items.length();i++){var item=items.getJSONObject(i);if(item.optLong("receivedAt")>=started){assessment=item;break;}}
                if(assessment==null)Thread.sleep(100);
            }
            assertNotNull("Production listener must persist a real assessment",assessment);
            assessmentId=assessment.getString("id");assertEquals("riesgo",assessment.getString("outcome"));assertEquals("reglas_de_texto",assessment.getString("coverage"));assertEquals("unavailable",assessment.getString("aiStatus"));
            evidence.put("assessmentId",assessmentId).put("outcome",assessment.getString("outcome")).put("coverage",assessment.getString("coverage")).put("aiStatus",assessment.getString("aiStatus")).put("reportMetadata",local.certiva.sdk.CertivaEngine.report(assessment,true));
            boolean posted=false;until=System.currentTimeMillis()+10000;
            while(!posted&&System.currentTimeMillis()<until){for(var item:manager.getActiveNotifications())if(assessmentId.equals(item.getTag())){posted=item.getNotification().contentIntent!=null;break;}if(!posted)Thread.sleep(100);}
            assertTrue("Production alert with same assessment ID",posted);phase("03a-native-certiva-alert-banner");
            assertTrue(automation.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_NOTIFICATIONS));phase("03b-native-certiva-alert-shade");
            var detailMonitor=getInstrumentation().addMonitor(ProtectionDetailActivity.class.getName(),null,false);
            assertTrue("Tap actual visible system notification",tapSystemText("Antes de responder, revisa esto",true));
            Activity detail=getInstrumentation().waitForMonitorWithTimeout(detailMonitor,10000);assertNotNull(detail);activities.add(detail);getInstrumentation().removeMonitor(detailMonitor);getInstrumentation().waitForIdleSync();
            assertEquals(assessmentId,detail.getIntent().getStringExtra("alert_id"));phase("04-alert-detail");
            var reportMonitor=getInstrumentation().addMonitor(MainActivity.class.getName(),null,false);click(detail,"Preparar reporte para el piloto");
            Activity report=getInstrumentation().waitForMonitorWithTimeout(reportMonitor,10000);assertNotNull(report);activities.add(report);getInstrumentation().removeMonitor(reportMonitor);getInstrumentation().waitForIdleSync();
            JSONObject reportAssessment=null;until=System.currentTimeMillis()+15000;
            while((reportAssessment=(JSONObject)field(report,"assessment"))==null&&System.currentTimeMillis()<until)Thread.sleep(100);
            assertNotNull(reportAssessment);assertEquals(assessmentId,reportAssessment.getString("id"));
            PilotAPI reportApi=(PilotAPI)field(report,"api");request(reportApi,"login","POST",login);assertTrue(reportApi.loggedIn);login=null;
            Button account=(Button)field(report,"account");TextView accountSummary=(TextView)field(report,"accountSummary");
            runTestOnUiThread(()->{account.setText("Cerrar sesión");accountSummary.setText("Sesión activa. Puedes consultar tus reportes y decidir qué resultados compartir.");});
            click(report,"Inicio");phase("05-new-home");click(report,"Menú");phase("06-new-menu");
            click(report,"Alertas");phase("07-saved-alerts");click(report,"Verificar");
            assertEquals(assessmentId,((JSONObject)field(report,"assessment")).getString("id"));
            click(report,"Revisar datos y reportar");phase("08-real-consent");
            assertTrue("Click explicit consent",tapSystemText("Confirmar y enviar",false));
            Button reportButton=(Button)find(report.getWindow().getDecorView(),"Revisar datos y reportar");
            until=System.currentTimeMillis()+25000;boolean received=false;
            while(!received&&System.currentTimeMillis()<until){
                if(reportButton!=null)received=reportButton.getText().toString().startsWith("Reporte recibido");
                else {View result=(View)field(report,"resultBox");received=hasReceipt(result);}
                if(!received)Thread.sleep(100);
            }
            assertTrue("App must show server receipt",received);phase("09-server-receipt");
            var cases=request(reportApi,"cases","GET",null).getJSONArray("cases");String caseId=null;
            for(int i=0;i<cases.length();i++){var item=cases.getJSONObject(i);if(assessmentId.equals(item.getJSONObject("report").optString("assessmentId"))){caseId=item.getString("id");break;}}
            assertNotNull("Same real assessment retained by server",caseId);evidence.put("caseId",caseId).put("reportSubmitted",true).put("passed",true);
        } catch(Throwable failure) {evidence.put("failureType",failure.getClass().getSimpleName());throw failure;
        } finally {
            boolean stopped=recorder==null;
            try {if(recorder!=null&&recorder.matches("[0-9]+")){shell("kill -2 "+recorder);long until=System.currentTimeMillis()+30000;while(System.currentTimeMillis()<until){String active=shell("pidof screenrecord");if(!java.util.Arrays.asList(active.split("\\s+")).contains(recorder)){stopped=true;break;}android.os.SystemClock.sleep(300);}}}catch(Exception ignored){evidence.put("recorderStopError",true);}
            evidence.put("recorderStopped",stopped);if(!stopped)evidence.put("passed",false);
            if(recordingPipe!=null)try{recordingPipe.close();}catch(Exception ignored){}
            credentials.delete();initialApi.close();
            if(serviceStarted)try{runTestOnUiThread(()->{try{harness.close();}catch(Exception e){throw new RuntimeException(e);}});}catch(Throwable ignored){evidence.put("serviceCleanupFailed",true).put("passed",false);}
            manager.cancel(INPUT_ID);if(assessmentId!=null)manager.cancel(assessmentId,1);manager.deleteNotificationChannel(INPUT_CHANNEL);
            try{restore(prefs,previous);}catch(Throwable ignored){evidence.put("preferenceRestoreFailed",true).put("passed",false);}
            writeEvidence();runTestOnUiThread(()->{for(Activity activity:activities)activity.finish();});
        }
    }
    private boolean hasReceipt(View root){if(root instanceof TextView&&((TextView)root).getText().toString().startsWith("Reporte recibido"))return true;if(root instanceof ViewGroup)for(int i=0;i<((ViewGroup)root).getChildCount();i++)if(hasReceipt(((ViewGroup)root).getChildAt(i)))return true;return false;}
}
