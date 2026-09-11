package local.certiva.pilot;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.test.InstrumentationTestCase;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import java.io.File;
import java.io.FileOutputStream;

/** Home navigation and input checks; never runs inference or sends reports. */
public final class HomeScreenTest extends InstrumentationTestCase {
    @Override protected void setUp()throws Exception{
        super.setUp();assertTrue(getInstrumentation().getUiAutomation().performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_HOME));
        android.os.SystemClock.sleep(500);
    }
    private View find(View root,String label){
        if(label.equals(root.getContentDescription())||(root instanceof TextView&&label.equals(((TextView)root).getText().toString())))return root;
        if(root instanceof ViewGroup)for(int i=0;i<((ViewGroup)root).getChildCount();i++){View found=find(((ViewGroup)root).getChildAt(i),label);if(found!=null)return found;}
        return null;
    }
    private void capture(String name)throws Exception{
        getInstrumentation().waitForIdleSync();android.os.SystemClock.sleep(800);
        var root=getInstrumentation().getUiAutomation().getRootInActiveWindow();assertNotNull(root);assertEquals("local.certiva.pilot",String.valueOf(root.getPackageName()));
        Bitmap bitmap=getInstrumentation().getUiAutomation().takeScreenshot();assertNotNull(bitmap);
        try(var stream=new FileOutputStream(new File(getInstrumentation().getTargetContext().getExternalFilesDir(null),name))){bitmap.compress(Bitmap.CompressFormat.PNG,100,stream);}finally{bitmap.recycle();}
    }
    public void testHomeInputAndProtectionNavigation()throws Throwable{
        var context=getInstrumentation().getTargetContext();
        Activity home=getInstrumentation().startActivitySync(new Intent(context,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));Activity protection=null;
        try{
            View root=home.getWindow().getDecorView();
            EditText input=(EditText)find(root,"Texto del mensaje");Button verify=(Button)find(root,"Verificar mensaje");
            assertNotNull(input);assertNotNull(verify);assertFalse("Empty message cannot be submitted",verify.isEnabled());
            assertNotNull(find(root,"Tu aliado contra el fraude"));assertNotNull(find(root,"Revisar un mensaje"));
            getInstrumentation().waitForIdleSync();
            View brand=find(root,"certiva");android.graphics.Rect visible=new android.graphics.Rect();assertTrue(brand.getLocalVisibleRect(visible));assertEquals("The brand must be fully visible on launch",brand.getHeight(),visible.height());
            capture("android-home-redesign.png");
            runTestOnUiThread(()->((Button)find(root,"Usar ejemplo")).performClick());
            long deadline=System.currentTimeMillis()+15000;
            while(!verify.isEnabled()&&System.currentTimeMillis()<deadline)android.os.SystemClock.sleep(100);
            assertTrue("Sample is editable and ready for review",verify.isEnabled());assertTrue(input.getText().length()>0);
            runTestOnUiThread(()->input.setText("   "));assertFalse(verify.isEnabled());
            Button setup=(Button)find(root,"Configurar protección");if(setup==null)setup=(Button)find(root,"Ver protección y alertas");assertNotNull(setup);
            var monitor=getInstrumentation().addMonitor(ProtectionActivity.class.getName(),null,false);Button action=setup;
            runTestOnUiThread(action::performClick);protection=getInstrumentation().waitForMonitorWithTimeout(monitor,5000);
            assertNotNull("Protection shortcut must open configuration",protection);getInstrumentation().waitForIdleSync();assertNotNull(find(protection.getWindow().getDecorView(),"Protección de WhatsApp"));
        }finally{Activity last=protection;runTestOnUiThread(()->{if(last!=null)last.finish();home.finish();});}
    }
    public void testSharedTextIsPreserved()throws Throwable{
        var context=getInstrumentation().getTargetContext();
        Activity home=getInstrumentation().startActivitySync(new Intent(context,MainActivity.class).setAction(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT,"Mensaje de prueba compartido").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        try{EditText input=(EditText)find(home.getWindow().getDecorView(),"Texto del mensaje");assertEquals("Mensaje de prueba compartido",input.getText().toString());capture("android-home-shared.png");}
        finally{runTestOnUiThread(home::finish);}
    }
}
