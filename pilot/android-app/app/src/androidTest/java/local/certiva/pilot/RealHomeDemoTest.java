package local.certiva.pilot;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Rect;
import android.test.InstrumentationTestCase;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import java.io.File;
import java.nio.file.Files;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONObject;

/** Opt-in live demo: real signed rules, real consent UI and one real pilot report.
 * No synthetic assessment is inserted. Credentials are removed before recording. */
public final class RealHomeDemoTest extends InstrumentationTestCase {
    private View find(View root,String label){
        if(label.equals(root.getContentDescription())||(root instanceof TextView&&label.equals(((TextView)root).getText().toString())))return root;
        if(root instanceof ViewGroup)for(int i=0;i<((ViewGroup)root).getChildCount();i++){View v=find(((ViewGroup)root).getChildAt(i),label);if(v!=null)return v;}
        return null;
    }
    private Object field(Activity activity,String name)throws Exception{var f=MainActivity.class.getDeclaredField(name);f.setAccessible(true);return f.get(activity);}
    private JSONObject request(PilotAPI api,String route,String method,JSONObject body)throws Exception{
        CountDownLatch done=new CountDownLatch(1);AtomicReference<JSONObject> result=new AtomicReference<>();AtomicReference<String> error=new AtomicReference<>();
        api.request(route,method,body,(r,e)->{result.set(r);error.set(e);done.countDown();});
        assertTrue("Pilot API timed out",done.await(20,TimeUnit.SECONDS));assertNull(error.get());return result.get();
    }
    private String shell(String command)throws Exception{
        try(var input=new android.os.ParcelFileDescriptor.AutoCloseInputStream(getInstrumentation().getUiAutomation().executeShellCommand(command))){return new String(input.readAllBytes(),java.nio.charset.StandardCharsets.UTF_8).trim();}
    }
    private void reveal(View view)throws Throwable{assertNotNull(view);runTestOnUiThread(()->view.requestRectangleOnScreen(new Rect(0,0,view.getWidth(),view.getHeight()),true));getInstrumentation().waitForIdleSync();android.os.SystemClock.sleep(900);}
    private void hold(){android.os.SystemClock.sleep(2500);}
    private android.view.accessibility.AccessibilityNodeInfo consentNode(android.view.accessibility.AccessibilityNodeInfo node,int depth){
        if(node==null||depth>20)return null;
        if(node.isVisibleToUser()&&node.getText()!=null&&"Confirmar y enviar".equalsIgnoreCase(node.getText().toString()))return node;
        for(int i=0;i<node.getChildCount();i++){var found=consentNode(node.getChild(i),depth+1);if(found!=null)return found;}return null;
    }
    private void capture(String name)throws Exception{
        var bitmap=getInstrumentation().getUiAutomation().takeScreenshot();assertNotNull(bitmap);
        try(var out=new java.io.FileOutputStream(new File(getInstrumentation().getTargetContext().getExternalFilesDir(null),name))){bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG,100,out);}finally{bitmap.recycle();}
    }
    public void testRealReviewConsentAndReport()throws Throwable{
        var context=getInstrumentation().getTargetContext();
        assertTrue("Dedicated emulator only","ranchu".equals(android.os.Build.HARDWARE)||"goldfish".equals(android.os.Build.HARDWARE));
        File credentials=new File(context.getFilesDir(),"demo-access.json");
        JSONObject evidence=new JSONObject().put("passed",false).put("input","Synthetic message entered in the real form; no assessment injected").put("recording","UI recording starts after authenticated login");
        evidence.put("startedAt",System.currentTimeMillis());
        Files.write(new File(context.getExternalFilesDir(null),"real-home-result.json").toPath(),evidence.toString(2).getBytes(java.nio.charset.StandardCharsets.UTF_8));
        Activity home=null;String recorder=null;android.os.ParcelFileDescriptor recordingPipe=null;
        try{
            JSONObject login=new JSONObject(new String(Files.readAllBytes(credentials.toPath()),java.nio.charset.StandardCharsets.UTF_8));Files.delete(credentials.toPath());
            assertFalse("This recording must identify the real rules fallback; no installed AI model",local.certiva.qvac.QvacRuntime.available(context));
            assertTrue(getInstrumentation().getUiAutomation().performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_HOME));
            android.os.SystemClock.sleep(800);
            android.util.Log.i("CertivaRealDemo","Opening home");
            home=getInstrumentation().startActivitySync(new Intent(context,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            android.util.Log.i("CertivaRealDemo","Home opened; authenticating");
            PilotAPI api=(PilotAPI)field(home,"api");request(api,"login","POST",login);assertTrue(api.loggedIn);login=null;
            android.util.Log.i("CertivaRealDemo","Authenticated; starting capture");
            View root=home.getWindow().getDecorView();Button account=(Button)find(root,"Ingresar");if(account!=null)runTestOnUiThread(()->account.setText("Cerrar sesión"));
            getInstrumentation().waitForIdleSync();
            String video="/sdcard/certiva-real-home-"+System.currentTimeMillis()+".mp4";evidence.put("remoteVideo",video);
            assertTrue("No other recording may be active",shell("pidof screenrecord").isEmpty());
            recordingPipe=getInstrumentation().getUiAutomation().executeShellCommand("screenrecord --size 540x1200 --bit-rate 700000 --time-limit 120 "+video);
            android.os.SystemClock.sleep(700);recorder=shell("pidof screenrecord");assertTrue("Native recorder must start",recorder.matches("[0-9]+"));hold();
            EditText input=(EditText)find(root,"Texto del mensaje");reveal(input);
            runTestOnUiThread(()->input.setText("Su cuenta será bloqueada hoy. Envíe el código de verificación para desbloquearla."));hold();
            Button verify=(Button)find(root,"Verificar mensaje");reveal(verify);
            long ready=System.currentTimeMillis()+15000;while(!verify.isEnabled()&&System.currentTimeMillis()<ready)Thread.sleep(100);assertTrue(verify.isEnabled());
            android.util.Log.i("CertivaRealDemo","Running real analysis");runTestOnUiThread(verify::performClick);
            long deadline=System.currentTimeMillis()+30000;JSONObject assessment;
            while((assessment=(JSONObject)field(home,"assessment"))==null&&System.currentTimeMillis()<deadline)Thread.sleep(100);
            assertNotNull("Real engine must return an assessment",assessment);
            assertEquals("riesgo",assessment.getString("outcome"));assertEquals("reglas_de_texto",assessment.getString("coverage"));assertEquals("unavailable",assessment.getString("aiStatus"));
            android.util.Log.i("CertivaRealDemo","Real rules assessment received");
            evidence.put("assessmentId",assessment.getString("id")).put("outcome",assessment.getString("outcome")).put("coverage",assessment.getString("coverage")).put("aiStatus",assessment.getString("aiStatus"));
            Button report=(Button)find(root,"Revisar datos y reportar");reveal(report);hold();
            assertNotNull(find(root,"IA no disponible. Esta alerta se basa en reglas de texto locales."));
            runTestOnUiThread(report::performClick);getInstrumentation().waitForIdleSync();hold();
            capture("real-consent.png");
            boolean confirmed=false;var automation=getInstrumentation().getUiAutomation();
            long consentDeadline=System.currentTimeMillis()+8000;
            while(!confirmed&&System.currentTimeMillis()<consentDeadline){
                var node=consentNode(automation.getRootInActiveWindow(),0);
                if(node!=null){
                    for(int depth=0;node!=null&&depth<3;depth++,node=node.getParent())if(node.isClickable()){confirmed=node.performAction(android.view.accessibility.AccessibilityNodeInfo.ACTION_CLICK);break;}
                    if(confirmed)break;
                }
                if(!confirmed)Thread.sleep(150);
            }
            assertTrue("The real consent button must be clicked",confirmed);
            long received=System.currentTimeMillis()+20000;while(!report.getText().toString().startsWith("Reporte recibido")&&System.currentTimeMillis()<received)Thread.sleep(100);
            assertTrue("The application must show the server receipt",report.getText().toString().startsWith("Reporte recibido"));hold();
            capture("real-receipt.png");
            var cases=request(api,"cases","GET",null).getJSONArray("cases");String caseId=null;
            for(int i=0;i<cases.length();i++){JSONObject item=cases.getJSONObject(i);if(assessment.getString("id").equals(item.getJSONObject("report").optString("assessmentId"))){caseId=item.getString("id");break;}}
            assertNotNull("Server must retain the same assessment ID",caseId);evidence.put("caseId",caseId).put("passed",true).put("reportSubmitted",true);
        }finally{
            if(recorder!=null&&recorder.matches("[0-9]+")){shell("kill -2 "+recorder);for(int i=0;i<30;i++){if(!shell("pidof screenrecord").contains(recorder))break;android.os.SystemClock.sleep(200);}}
            if(recordingPipe!=null)recordingPipe.close();
            credentials.delete();Files.write(new File(context.getExternalFilesDir(null),"real-home-result.json").toPath(),evidence.toString(2).getBytes(java.nio.charset.StandardCharsets.UTF_8));
            if(home!=null){Activity opened=home;runTestOnUiThread(opened::finish);}
        }
    }
}
