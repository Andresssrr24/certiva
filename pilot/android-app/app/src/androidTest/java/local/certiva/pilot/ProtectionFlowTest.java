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

/** Posts an alert outside the app, taps it in the system shade and verifies the report flow. */
public class ProtectionFlowTest extends InstrumentationTestCase {
    protected boolean contains(View view,String text){
        if(view instanceof TextView && ((TextView)view).getText().toString().contains(text))return true;
        if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++)if(contains(((ViewGroup)view).getChildAt(i),text))return true;
        return false;
    }
    protected void screenshot(String name)throws Exception{
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
        var automation=getInstrumentation().getUiAutomation();
        var serviceInfo=automation.getServiceInfo();serviceInfo.flags|=android.accessibilityservice.AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS;automation.setServiceInfo(serviceInfo);
        assertTrue("Must return to Android home",automation.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_HOME));
        screenshot("android-protection-home.png");
        var monitor=getInstrumentation().addMonitor(ProtectionDetailActivity.class.getName(),null,false);
        runTestOnUiThread(()->ProtectionNotifications.post(context,result));
        var manager=context.getSystemService(NotificationManager.class);
        long postedDeadline=System.currentTimeMillis()+10000;
        while(manager.getActiveNotifications().length==0 && System.currentTimeMillis()<postedDeadline)Thread.sleep(100);
        var notifications=manager.getActiveNotifications();assertTrue(notifications.length>0);
        assertTrue("Must open native notification shade",automation.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_NOTIFICATIONS));
        long shadeDeadline=System.currentTimeMillis()+30000;boolean tapped=false;
        while(!tapped&&System.currentTimeMillis()<shadeDeadline){
            for(var window:automation.getWindows()){
                var node=findNotification(window.getRoot(),0);
                if(node!=null){
                    screenshot("android-protection-notification.png");
                    android.graphics.Rect bounds=new android.graphics.Rect();node.getBoundsInScreen(bounds);
                    if(!bounds.isEmpty()){
                        long now=android.os.SystemClock.uptimeMillis();
                        var down=android.view.MotionEvent.obtain(now,now,android.view.MotionEvent.ACTION_DOWN,bounds.centerX(),bounds.centerY(),0);
                        var up=android.view.MotionEvent.obtain(now,now+80,android.view.MotionEvent.ACTION_UP,bounds.centerX(),bounds.centerY(),0);
                        try{down.setSource(android.view.InputDevice.SOURCE_TOUCHSCREEN);up.setSource(android.view.InputDevice.SOURCE_TOUCHSCREEN);tapped=automation.injectInputEvent(down,true)&&automation.injectInputEvent(up,true);}finally{down.recycle();up.recycle();}
                    }
                }
                if(tapped)break;
            }
            if(!tapped)Thread.sleep(150);
        }
        if(!tapped){
            screenshot("android-protection-notification.png");
            StringBuilder debug=new StringBuilder();
            for(var notification:manager.getActiveNotifications())debug.append(notification.getKey()).append(" ").append(notification.getNotification().extras.getCharSequence(android.app.Notification.EXTRA_TITLE)).append("\n");
            for(var window:automation.getWindows())appendNodes(window.getRoot(),debug,0);
            try(var out=new FileOutputStream(new File(context.getExternalFilesDir(null),"android-notification-debug.txt"))){out.write(debug.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));}
        }
        assertTrue("Must tap the visible Certiva notification in Android",tapped);
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
        getInstrumentation().waitForIdleSync();assertTrue(contains(setup.getWindow().getDecorView(),"Protección de WhatsApp"));
        assertTrue("Setup must expose activation or model installation",contains(setup.getWindow().getDecorView(),"Activar protección")||contains(setup.getWindow().getDecorView(),"IA en este teléfono"));
        screenshot("android-protection-settings.png");
        runTestOnUiThread(()->{setup.finish();report.finish();detail.finish();main.finish();});
    }
    private android.view.accessibility.AccessibilityNodeInfo findNotification(android.view.accessibility.AccessibilityNodeInfo node,int depth){
        if(node==null||depth>20)return null;
        if(node.isVisibleToUser()&&node.getText()!=null&&node.getText().toString().contains("Antes de responder, revisa esto"))return node;
        for(int i=0;i<node.getChildCount();i++){var found=findNotification(node.getChild(i),depth+1);if(found!=null)return found;}
        return null;
    }
    private void appendNodes(android.view.accessibility.AccessibilityNodeInfo node,StringBuilder out,int depth){
        if(node==null||depth>16)return;out.append(node.getPackageName()).append(" ").append(node.getText()).append(" ").append(node.getContentDescription()).append(" clickable=").append(node.isClickable()).append("\n");
        for(int i=0;i<node.getChildCount();i++)appendNodes(node.getChild(i),out,depth+1);
    }
    protected boolean clickText(View view,String text){
        if(view instanceof android.widget.Button && ((TextView)view).getText().toString().equals(text)){view.performClick();return true;}
        if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++)if(clickText(((ViewGroup)view).getChildAt(i),text))return true;
        return false;
    }
}
