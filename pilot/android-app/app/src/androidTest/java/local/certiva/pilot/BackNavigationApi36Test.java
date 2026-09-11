package local.certiva.pilot;

import android.app.Activity;
import android.content.Intent;
import android.test.InstrumentationTestCase;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.TextView;

/** Exercises Android's back dispatch; no inference, permissions or report submission. */
public final class BackNavigationApi36Test extends InstrumentationTestCase {
    private Activity activity;
    private View root;
    @Override protected void setUp() throws Exception {
        super.setUp();
        activity=getInstrumentation().startActivitySync(new Intent(getInstrumentation().getTargetContext(),MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TASK));
        root=activity.getWindow().getDecorView();
        getInstrumentation().waitForIdleSync();
    }
    @Override protected void tearDown() throws Exception {
        try { getInstrumentation().runOnMainSync(()->activity.finish()); }
        finally { super.tearDown(); }
    }
    private View find(View view,String label) {
        if(label.equals(view.getContentDescription())||(view instanceof TextView&&label.contentEquals(((TextView)view).getText())))return view;
        if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++){
            View match=find(((ViewGroup)view).getChildAt(i),label);if(match!=null)return match;
        }
        return null;
    }
    private void tap(String label) throws Throwable {
        View view=find(root,label);assertNotNull(label,view);assertTrue(view.isShown());
        runTestOnUiThread(view::performClick);getInstrumentation().waitForIdleSync();
    }
    private void back() throws Exception {
        assertTrue(getInstrumentation().getUiAutomation().performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_BACK));
        android.os.SystemClock.sleep(650);getInstrumentation().waitForIdleSync();
    }
    public void testSystemBackReturnsHomeFromEveryTabAndLeavesRoot() throws Throwable {
        for(String label:new String[]{"Verificar","Alertas","Menú"}){
            tap(label);assertTrue(find(root,label).isSelected());back();
            assertTrue("Back from "+label,find(root,"Inicio").isSelected());
        }
        back();
        assertFalse("Back from Inicio must leave the foreground activity",activity.hasWindowFocus());
    }
    public void testRecreatedMenuRestoresBackAndKeepsDraft() throws Throwable {
        tap("Verificar");
        runTestOnUiThread(()->((EditText)find(root,"Texto del mensaje")).setText("Borrador local de prueba"));
        tap("Menú");
        var monitor=getInstrumentation().addMonitor(MainActivity.class.getName(),null,false);
        try {
            runTestOnUiThread(activity::recreate);
            Activity recreated=getInstrumentation().waitForMonitorWithTimeout(monitor,8000);
            assertNotNull(recreated);activity=recreated;root=activity.getWindow().getDecorView();
            getInstrumentation().waitForIdleSync();assertTrue(find(root,"Menú").isSelected());
            back();assertTrue(find(root,"Inicio").isSelected());
            tap("Verificar");assertEquals("Borrador local de prueba",((EditText)find(root,"Texto del mensaje")).getText().toString());
        }finally{getInstrumentation().removeMonitor(monitor);}
    }
}
