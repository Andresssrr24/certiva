package local.certiva.pilot;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Rect;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;

/** Recorded UI-only tour via saved alerts. Does not validate system notification delivery. */
public final class UiInternalFlowTest extends UiFixtureFlowTest {
    private Button button(View root,String label){
        if(root instanceof Button&&((Button)root).getText().toString().equals(label))return (Button)root;
        if(root instanceof ViewGroup)for(int i=0;i<((ViewGroup)root).getChildCount();i++){Button found=button(((ViewGroup)root).getChildAt(i),label);if(found!=null)return found;}
        return null;
    }
    private void reveal(Button button)throws Throwable{
        assertNotNull(button);runTestOnUiThread(()->button.requestRectangleOnScreen(new Rect(0,0,button.getWidth(),button.getHeight()),true));
        getInstrumentation().waitForIdleSync();android.os.SystemClock.sleep(1000);
    }
    @Override public void testTapOpensDetailAndReport()throws Throwable{
        var context=getInstrumentation().getTargetContext();
        final java.util.ArrayList<Activity> opened=new java.util.ArrayList<>();
        try{
            Activity protection=getInstrumentation().startActivitySync(new Intent(context,ProtectionActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));opened.add(protection);
            screenshot("android-protection-settings.png");android.os.SystemClock.sleep(1500);
            Button alert=button(protection.getWindow().getDecorView(),"Encontramos señales de riesgo");reveal(alert);
            screenshot("android-protection-recent.png");android.os.SystemClock.sleep(1500);
            var detailMonitor=getInstrumentation().addMonitor(ProtectionDetailActivity.class.getName(),null,false);
            runTestOnUiThread(alert::performClick);
            Activity detail=getInstrumentation().waitForMonitorWithTimeout(detailMonitor,10000);assertNotNull("Saved alert must open detail",detail);opened.add(detail);
            assertTrue(contains(detail.getWindow().getDecorView(),"Señales encontradas"));
            screenshot("android-protection-detail.png");android.os.SystemClock.sleep(1500);
            Button reportButton=button(detail.getWindow().getDecorView(),"Preparar reporte para el piloto");reveal(reportButton);
            var reportMonitor=getInstrumentation().addMonitor(MainActivity.class.getName(),null,false);
            runTestOnUiThread(reportButton::performClick);
            Activity report=getInstrumentation().waitForMonitorWithTimeout(reportMonitor,10000);assertNotNull(report);opened.add(report);
            long deadline=System.currentTimeMillis()+15000;
            while(!contains(report.getWindow().getDecorView(),"Revisar datos y reportar")&&System.currentTimeMillis()<deadline)Thread.sleep(100);
            assertTrue("Report preview must receive saved assessment",contains(report.getWindow().getDecorView(),"Revisar datos y reportar"));
            reveal(button(report.getWindow().getDecorView(),"Revisar datos y reportar"));
            screenshot("android-protection-report.png");android.os.SystemClock.sleep(1500);
            runTestOnUiThread(report::finish);screenshot("android-protection-return.png");
        }finally{runTestOnUiThread(()->{for(Activity a:opened)a.finish();});}
    }
}
