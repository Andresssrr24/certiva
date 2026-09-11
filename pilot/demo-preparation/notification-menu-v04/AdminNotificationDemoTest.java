package local.certiva.pilot;

import android.app.Activity;
import android.content.Intent;
import android.app.UiAutomation;
import android.test.InstrumentationTestCase;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/** Real console UI for the same new notification demo case. Native recorder starts
 * after login. No screenshot capture during phases. Final server state is checked
 * independently by the host recorder, not by another WebView fetch. */
public final class AdminNotificationDemoTest extends InstrumentationTestCase {
    private Activity activity;
    private WebView web;
    private final JSONArray phases = new JSONArray();
    private File outputs;
    private JSONObject evidence;

    private Object js(String expression) throws Throwable {
        CountDownLatch latch=new CountDownLatch(1);
        AtomicReference<String> value=new AtomicReference<>();
        runTestOnUiThread(()->web.evaluateJavascript(expression, r->{value.set(r);latch.countDown();}));
        assertTrue("WebView evaluation timeout",latch.await(10,TimeUnit.SECONDS));
        return new JSONTokener(value.get()).nextValue();
    }
    private void until(String expression, long millis) throws Throwable {
        long deadline=System.currentTimeMillis()+millis;
        do {if(Boolean.TRUE.equals(js(expression)))return;Thread.sleep(120);}while(System.currentTimeMillis()<deadline);
        fail("Expected UI state: "+expression);
    }
    private void write(String name,JSONObject value)throws Exception {
        try(var out=new FileOutputStream(new File(outputs,name))){out.write(value.toString(2).getBytes(StandardCharsets.UTF_8));}
    }
    private String shell(String command)throws Exception {
        try(var in=new android.os.ParcelFileDescriptor.AutoCloseInputStream(getInstrumentation().getUiAutomation().executeShellCommand(command))){return new String(in.readAllBytes(),StandardCharsets.UTF_8).trim();}
    }
    private long recordingStarted;
    private void phase(String name)throws Throwable {
        phases.put(new JSONObject().put("name",name).put("at",System.currentTimeMillis()).put("recordingElapsedMs",android.os.SystemClock.elapsedRealtime()-recordingStarted));
        write("admin-notification-result.json",evidence);
        android.util.Log.i("CertivaAdminDemo",name);Thread.sleep(2400);
    }
    public void testSameMobileCaseThroughAdminUI() throws Throwable {
        var context=getInstrumentation().getTargetContext();
        assertTrue("Only the dedicated emulator", "ranchu".equals(android.os.Build.HARDWARE)||"goldfish".equals(android.os.Build.HARDWARE));
        outputs=context.getExternalFilesDir(null);
        File secret=new File(context.getFilesDir(),"admin-notification-private.json");
        JSONObject config=new JSONObject(new String(Files.readAllBytes(secret.toPath()),StandardCharsets.UTF_8));
        assertTrue("Delete temporary credential file",secret.delete());
        String caseId=config.getString("caseId"),assessmentId=config.getString("assessmentId");
        assertTrue(caseId.matches("[a-zA-Z0-9-]{8,80}"));
        evidence=new JSONObject().put("caseId",caseId).put("assessmentId",assessmentId)
            .put("origin","http://127.0.0.1:4320").put("phases",phases).put("passed",false);
        String recorder=null;android.os.ParcelFileDescriptor recordingPipe=null;
        try {
            assertTrue("Freeze landscape before launching the Activity",getInstrumentation().getUiAutomation().setRotation(UiAutomation.ROTATION_FREEZE_90));
            getInstrumentation().waitForIdleSync();
            android.os.SystemClock.sleep(800);
            activity=getInstrumentation().startActivitySync(new Intent(context,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TASK));
            runTestOnUiThread(()->{
                web=new WebView(activity);web.getSettings().setJavaScriptEnabled(true);
                web.getSettings().setUseWideViewPort(true);web.getSettings().setLoadWithOverviewMode(true);
                web.getSettings().setAllowFileAccess(false);web.getSettings().setAllowContentAccess(false);
                web.setWebViewClient(new WebViewClient());activity.setContentView(web);
                web.loadUrl("http://127.0.0.1:4320/");
            });
            until("document.readyState==='complete' && !!document.querySelector('#login-form')",20000);
            // Desktop viewport affects layout only; all application code and data
            // come from the real pilot server without modification.
            js("document.querySelector('meta[name=viewport]').content='width=1280'; true");
            js("document.querySelector('#username').value="+JSONObject.quote(config.getString("username"))+";document.querySelector('#password').value="+JSONObject.quote(config.getString("password"))+";document.querySelector('#login-form button[type=submit]').click();true");
            config.remove("password");
            until("!document.querySelector('#workspace').hidden && [...document.querySelectorAll('#case-list button')].some(b=>b.textContent.includes("+JSONObject.quote(caseId.substring(0,8))+"))",20000);
            // Verify association read-only through the authenticated page session.
            js("window.demoCase=null;fetch('/api/cases').then(r=>r.json()).then(r=>window.demoCase=r.cases.find(c=>c.id==="+JSONObject.quote(caseId)+"));true");
            until("!!window.demoCase",10000);
            assertEquals(assessmentId,js("window.demoCase.report.assessmentId"));
            assertEquals("nuevo",js("window.demoCase.state"));
            js("document.querySelector('#cases-view').scrollIntoView({block:'start'});true");
            assertTrue("No other recorder",shell("pidof screenrecord").isEmpty());
            String video="/sdcard/certiva-admin-notification-"+System.currentTimeMillis()+".mp4";
            evidence.put("remoteVideo",video);recordingStarted=android.os.SystemClock.elapsedRealtime();
            recordingPipe=getInstrumentation().getUiAutomation().executeShellCommand("screenrecord --size 1280x576 --bit-rate 1200000 --time-limit 120 "+video);
            Thread.sleep(800);recorder=shell("pidof screenrecord");assertTrue("Recorder started",recorder.matches("[0-9]+"));
            phase("01-recepcion");
            js("[...document.querySelectorAll('#case-list button')].find(b=>b.textContent.includes("+JSONObject.quote(caseId.substring(0,8))+")).click();true");
            until("document.querySelector('#case-detail').textContent.includes('Tomar caso')",10000);
            js("document.querySelector('#case-detail').scrollIntoView({block:'start'});true");
            phase("02-detalle");
            js("[...document.querySelectorAll('#case-detail button')].find(b=>b.textContent==='Tomar caso').click();true");
            until("document.querySelector('#case-detail').textContent.includes('Responsable: analista')",10000);
            js("document.querySelector('#resolution').scrollIntoView({block:'center'});true");
            phase("03-asignacion");
            js("const choice=document.querySelector('#resolution');choice.value='sin_evidencia';choice.dispatchEvent(new Event('change',{bubbles:true}));true");
            phase("04-conclusion");
            js("[...document.querySelectorAll('#case-detail button')].find(b=>b.textContent==='Resolver caso').click();true");
            until("document.querySelector('#case-detail').textContent.includes('Resuelto') && document.querySelector('#case-detail').textContent.includes('Sin evidencia suficiente')",10000);
            js("document.querySelector('#case-detail').scrollIntoView({block:'start'});true");
            phase("05-resuelto");
            js("document.querySelector('[data-view=audit]').click();true");
            until("document.querySelector('#audit-list').textContent.includes("+JSONObject.quote(caseId.substring(0,8))+")",10000);
            js("document.querySelector('#audit-list').scrollIntoView({block:'start'});true");
            phase("06-auditoria");
            evidence.put("uiPassed",true).put("passed",false).put("requiresBackendVerification",true);
        } finally {
            boolean stopped=recorder==null;
            try{if(recorder!=null&&recorder.matches("[0-9]+")){shell("kill -2 "+recorder);long until=System.currentTimeMillis()+30000;while(System.currentTimeMillis()<until){String active=shell("pidof screenrecord");if(!java.util.Arrays.asList(active.split("\\s+")).contains(recorder)){stopped=true;break;}Thread.sleep(300);}}}catch(Exception ignored){evidence.put("recorderStopError",true);}
            evidence.put("recorderStopped",stopped);if(recordingPipe!=null)try{recordingPipe.close();}catch(Exception ignored){}
            write("admin-notification-result.json",evidence);
            runTestOnUiThread(()->{if(web!=null)web.destroy();if(activity!=null)activity.finish();});
            getInstrumentation().getUiAutomation().setRotation(UiAutomation.ROTATION_UNFREEZE);
            secret.delete();
        }
    }
}
