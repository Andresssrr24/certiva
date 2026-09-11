package local.certiva.pilot;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.test.InstrumentationTestCase;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.TextView;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;

/** Real native navigation checks. No inference, network requests or report submission. */
public final class NavigationScreenTest extends InstrumentationTestCase {
    private Activity home;
    private View root;
    @Override protected void setUp() throws Exception {
        super.setUp();getInstrumentation().getUiAutomation().setRotation(android.app.UiAutomation.ROTATION_FREEZE_0);
        getInstrumentation().waitForIdleSync();
        android.os.SystemClock.sleep(700);
        home=getInstrumentation().startActivitySync(new Intent(getInstrumentation().getTargetContext(),MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TASK));
        root=home.getWindow().getDecorView();
        getInstrumentation().waitForIdleSync();
    }
    @Override protected void tearDown() throws Exception {
        try { getInstrumentation().runOnMainSync(()->home.finish()); } finally { super.tearDown(); }
    }
    private View find(View v,String label) {
        if(label.equals(v.getContentDescription())||(v instanceof TextView&&label.equals(((TextView)v).getText().toString())))return v;
        if(v instanceof ViewGroup)for(int i=0;i<((ViewGroup)v).getChildCount();i++){View match=find(((ViewGroup)v).getChildAt(i),label);if(match!=null)return match;}
        return null;
    }
    private void tap(String label) throws Throwable {
        View v=find(root,label);assertNotNull(label,v);assertTrue(label+" must be on the active page",v.isShown());
        runTestOnUiThread(v::performClick);getInstrumentation().waitForIdleSync();
    }
    private void capture(String file) throws Exception {
        android.os.SystemClock.sleep(500);getInstrumentation().waitForIdleSync();
        Bitmap image=getInstrumentation().getUiAutomation().takeScreenshot();assertNotNull(image);
        try(FileOutputStream stream=new FileOutputStream(new File(home.getExternalFilesDir(null),file))){image.compress(Bitmap.CompressFormat.PNG,100,stream);}finally{image.recycle();}
    }
    public void testTabsKeepDraftAndBackReturnsHome() throws Throwable {
        assertTrue(find(root,"Inicio").isSelected());
        assertFalse(find(root,"Texto del mensaje").isShown());
        capture("menu-home.png");
        tap("Verificar");
        EditText input=(EditText)find(root,"Texto del mensaje");
        runTestOnUiThread(()->input.setText("Mi borrador sin enviar"));
        capture("menu-verify.png");
        tap("Menú");assertTrue(find(root,"Tu espacio").isShown());capture("menu-account.png");
        tap("Alertas");assertTrue(find(root,"Tus alertas").isShown());capture("menu-alerts.png");
        tap("Verificar");assertEquals("Mi borrador sin enviar",input.getText().toString());
        assertTrue(getInstrumentation().getUiAutomation().performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_BACK));android.os.SystemClock.sleep(500);getInstrumentation().waitForIdleSync();
        assertTrue(find(root,"Inicio").isSelected());assertFalse(input.isShown());
        android.graphics.Rect visible=new android.graphics.Rect();View nav=find(root,"Menú");
        assertTrue(nav.getLocalVisibleRect(visible));assertEquals(nav.getHeight(),visible.height());
    }
    public void testMenuOpensModelAndProtection() throws Throwable {
        tap("Menú");
        checkDestination("Mi protección. Permisos y revisión de WhatsApp",ProtectionActivity.class);
        checkDestination("IA en este teléfono. Modelo local y configuración",local.certiva.qvac.ModelActivity.class);
        tap("Alertas guardadas. Resultados de los últimos 7 días");
        assertTrue(find(root,"Alertas").isSelected());
    }
    private void checkDestination(String label,Class<?> destination) throws Throwable {
        var monitor=getInstrumentation().addMonitor(destination.getName(),null,false);
        Activity opened=null;
        try { tap(label);opened=getInstrumentation().waitForMonitorWithTimeout(monitor,5000);assertNotNull(label,opened); }
        finally { Activity last=opened;if(last!=null)runTestOnUiThread(last::finish);getInstrumentation().removeMonitor(monitor);getInstrumentation().waitForIdleSync(); }
    }
    public void testDraftAndTabSurviveRecreation() throws Throwable {
        tap("Verificar");
        EditText input=(EditText)find(root,"Texto del mensaje");
        runTestOnUiThread(()->input.setText("Borrador que debe conservarse"));
        tap("Menú");
        var monitor=getInstrumentation().addMonitor(MainActivity.class.getName(),null,false);
        try {
            runTestOnUiThread(home::recreate);
            Activity recreated=getInstrumentation().waitForMonitorWithTimeout(monitor,8000);
            assertNotNull("Recreated activity",recreated);home=recreated;root=home.getWindow().getDecorView();
            getInstrumentation().waitForIdleSync();assertTrue(find(root,"Menú").isSelected());
            tap("Verificar");assertEquals("Borrador que debe conservarse",((EditText)find(root,"Texto del mensaje")).getText().toString());
        } finally {getInstrumentation().removeMonitor(monitor);}
    }
    public void testSavedAlertAppearsAndOpensDetail() throws Throwable {
        var prefs=ProtectionStore.prefs(home);String backup=prefs.getString("alerts",null);
        Activity detail=null;
        var monitor=getInstrumentation().addMonitor(ProtectionDetailActivity.class.getName(),null,false);
        try {
            JSONObject fixture=new JSONObject().put("id","navigation-ui-fixture").put("title","Alerta de prueba de navegación")
                .put("channel","whatsapp").put("receivedAt",System.currentTimeMillis()).put("outcome","riesgo")
                .put("coverage","reglas_de_texto").put("aiStatus","unavailable").put("action","Resultado controlado para probar la interfaz")
                .put("reasons",new JSONArray());
            prefs.edit().putString("alerts",new JSONArray().put(fixture).toString()).commit();
            getInstrumentation().waitForIdleSync();tap("Alertas");
            View label=find((View)find(root,"Tus alertas").getParent(),"Alerta de prueba de navegación");assertNotNull(label);assertTrue(label.isShown());
            View card=(View)label.getParent();runTestOnUiThread(card::performClick);
            detail=getInstrumentation().waitForMonitorWithTimeout(monitor,5000);assertNotNull(detail);
            getInstrumentation().waitForIdleSync();assertNotNull(find(detail.getWindow().getDecorView(),"Alerta de prueba de navegación"));
        } finally {
            Activity last=detail;if(last!=null)runTestOnUiThread(last::finish);
            if(backup==null)prefs.edit().remove("alerts").commit();else prefs.edit().putString("alerts",backup).commit();
            getInstrumentation().removeMonitor(monitor);
        }
    }
}
