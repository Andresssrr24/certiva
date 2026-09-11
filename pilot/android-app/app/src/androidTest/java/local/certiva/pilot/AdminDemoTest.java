package local.certiva.pilot;

import android.app.Activity;
import android.content.Intent;
import android.app.UiAutomation;
import android.graphics.Bitmap;
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

/** Records the real admin website against the same case created by the mobile demo.
 * No assessments, cases or audit events are inserted by this test.
 * Provision admin-demo-private.json in app-private files before running; it is
 * deleted after reading. Fields: username, password, caseId, assessmentId.
 * Start screenrecord after admin-demo-ready.json appears, then create the private
 * admin-demo-recording-started marker. This keeps credentials out of the movie.
 */
public final class AdminDemoTest extends InstrumentationTestCase {
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
    private void phase(String name)throws Throwable {
        phases.put(new JSONObject().put("name",name).put("at",System.currentTimeMillis()));
        Thread.sleep(1600);
        var automation=getInstrumentation().getUiAutomation();
        var root=automation.getRootInActiveWindow();
        if(root!=null)assertTrue("Android overlay blocks recording",root.findAccessibilityNodeInfosByText("isn't responding").isEmpty());
        Bitmap image=automation.takeScreenshot();assertNotNull(image);
        try(var out=new FileOutputStream(new File(outputs,"admin-"+name+".png"))){image.compress(Bitmap.CompressFormat.PNG,100,out);}finally{image.recycle();}
        Thread.sleep(1400);
    }
    public void testSameMobileCaseThroughAdminUI() throws Throwable {
        var context=getInstrumentation().getTargetContext();
        assertTrue("Only the dedicated emulator", "ranchu".equals(android.os.Build.HARDWARE)||"goldfish".equals(android.os.Build.HARDWARE));
        outputs=context.getExternalFilesDir(null);
        File secret=new File(context.getFilesDir(),"admin-demo-private.json");
        JSONObject config=new JSONObject(new String(Files.readAllBytes(secret.toPath()),StandardCharsets.UTF_8));
        assertTrue("Delete temporary credential file",secret.delete());
        String caseId=config.getString("caseId"),assessmentId=config.getString("assessmentId");
        assertTrue(caseId.matches("[a-zA-Z0-9-]{8,80}"));
        evidence=new JSONObject().put("caseId",caseId).put("assessmentId",assessmentId)
            .put("origin","http://127.0.0.1:4320").put("phases",phases).put("passed",false);
        File marker=new File(context.getFilesDir(),"admin-demo-recording-started");
        if(marker.exists())assertTrue(marker.delete());
        try {
            assertTrue(getInstrumentation().getUiAutomation().performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_HOME));
            android.os.SystemClock.sleep(800);
            assertTrue("Freeze landscape before launching the Activity",getInstrumentation().getUiAutomation().setRotation(UiAutomation.ROTATION_FREEZE_90));
            getInstrumentation().waitForIdleSync();
            android.os.SystemClock.sleep(800);
            activity=getInstrumentation().startActivitySync(new Intent(context,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
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
            write("admin-demo-ready.json",new JSONObject().put("caseId",caseId).put("ready",true));
            long deadline=System.currentTimeMillis()+60000;
            while(!marker.exists()&&System.currentTimeMillis()<deadline)Thread.sleep(100);
            assertTrue("Recorder must start before visible workflow",marker.exists());
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
            js("window.demoAudit=null;window.demoFinal=null;fetch('/api/audit').then(r=>r.json()).then(r=>window.demoAudit=r.events.filter(e=>e.case_id==="+JSONObject.quote(caseId)+"));fetch('/api/cases').then(r=>r.json()).then(r=>window.demoFinal=r.cases.find(c=>c.id==="+JSONObject.quote(caseId)+"));true");
            until("!!window.demoAudit && !!window.demoFinal",10000);
            assertEquals("resuelto",js("window.demoFinal.state"));
            assertEquals(assessmentId,js("window.demoFinal.report.assessmentId"));
            evidence.put("finalCase",new JSONObject((String)js("JSON.stringify(window.demoFinal)")));
            evidence.put("auditEvents",new JSONArray((String)js("JSON.stringify(window.demoAudit)")));
            evidence.put("passed",true);
        } finally {
            write("admin-demo-result.json",evidence);
            runTestOnUiThread(()->{if(web!=null)web.destroy();if(activity!=null)activity.finish();});
            getInstrumentation().getUiAutomation().setRotation(UiAutomation.ROTATION_UNFREEZE);
            if(marker.exists())marker.delete();
        }
    }
}
