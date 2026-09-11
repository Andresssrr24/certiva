package local.certiva.pilot;

import android.app.Activity;
import android.app.NotificationManager;
import android.content.Intent;
import android.graphics.Bitmap;
import android.test.InstrumentationTestCase;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import java.io.File;
import java.io.FileOutputStream;

/** Verifies that a real notification PendingIntent opens the native detail, then the report form. */
public final class ProtectionFlowTest extends InstrumentationTestCase {
    private boolean contains(View view,String text){
        if(view instanceof TextView && ((TextView)view).getText().toString().contains(text))return true;
        if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++)if(contains(((ViewGroup)view).getChildAt(i),text))return true;
        return false;
    }
    private void screenshot(String name)throws Exception{
        getInstrumentation().waitForIdleSync();
        android.os.SystemClock.sleep(800);
        var root=getInstrumentation().getUiAutomation().getRootInActiveWindow();
        if(root!=null)assertTrue("System overlay blocks visual verification",root.findAccessibilityNodeInfosByText("isn't responding").isEmpty());
        Bitmap bitmap=getInstrumentation().getUiAutomation().takeScreenshot();assertNotNull(bitmap);
        try(var out=new FileOutputStream(new File(getInstrumentation().getTargetContext().getExternalFilesDir(null),name))){bitmap.compress(Bitmap.CompressFormat.PNG,100,out);}finally{bitmap.recycle();}
    }
    public void testTapOpensDetailAndReport()throws Throwable{
        var context=getInstrumentation().getTargetContext();
        var alerts=ProtectionStore.alerts(context);assertTrue("Run ProtectionTest first",alerts.length()>0);
        var result=alerts.getJSONObject(0);
        Activity main=getInstrumentation().startActivitySync(new Intent(context,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        getInstrumentation().waitForIdleSync();screenshot("android-protection-main.png");
        var monitor=getInstrumentation().addMonitor(ProtectionDetailActivity.class.getName(),null,false);
        runTestOnUiThread(()->ProtectionNotifications.post(context,result));
        var manager=context.getSystemService(NotificationManager.class);
        long postedDeadline=System.currentTimeMillis()+10000;
        while(manager.getActiveNotifications().length==0 && System.currentTimeMillis()<postedDeadline)Thread.sleep(100);
        var notifications=manager.getActiveNotifications();assertTrue(notifications.length>0);
        runTestOnUiThread(()->{try{notifications[0].getNotification().contentIntent.send();}catch(Exception e){throw new RuntimeException(e);}});
        Activity detail=getInstrumentation().waitForMonitorWithTimeout(monitor,5000);assertNotNull("Notification must open native detail",detail);
        getInstrumentation().waitForIdleSync();
        assertTrue(contains(detail.getWindow().getDecorView(),"Señales encontradas"));
        assertTrue(contains(detail.getWindow().getDecorView(),"Preparar reporte para el piloto"));
        screenshot("android-protection-detail.png");
        var reportMonitor=getInstrumentation().addMonitor(MainActivity.class.getName(),null,false);
        runTestOnUiThread(()->clickText(detail.getWindow().getDecorView(),"Preparar reporte para el piloto"));
        Activity report=getInstrumentation().waitForMonitorWithTimeout(reportMonitor,5000);assertNotNull(report);
        long deadline=System.currentTimeMillis()+10000;
        while(!contains(report.getWindow().getDecorView(),"Revisar datos y reportar")&&System.currentTimeMillis()<deadline)Thread.sleep(100);
        assertTrue("Alert assessment must reach existing report flow",contains(report.getWindow().getDecorView(),"Revisar datos y reportar"));
        screenshot("android-protection-report.png");
        Activity setup=getInstrumentation().startActivitySync(new Intent(context,ProtectionActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        getInstrumentation().waitForIdleSync();assertTrue(contains(setup.getWindow().getDecorView(),"Activar protección"));
        screenshot("android-protection-settings.png");
        runTestOnUiThread(()->{setup.finish();report.finish();detail.finish();main.finish();});
    }
    private boolean clickText(View view,String text){
        if(view instanceof android.widget.Button && ((TextView)view).getText().toString().equals(text)){view.performClick();return true;}
        if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++)if(clickText(((ViewGroup)view).getChildAt(i),text))return true;
        return false;
    }
}
