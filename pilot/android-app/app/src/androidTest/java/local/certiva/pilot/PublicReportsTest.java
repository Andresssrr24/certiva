package local.certiva.pilot;

import android.test.InstrumentationTestCase;
import local.certiva.sdk.CertivaEngine;
import org.json.JSONObject;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

public final class PublicReportsTest extends InstrumentationTestCase {
    private JSONObject request(PilotAPI api, String route, String method, JSONObject data) throws Exception {
        CountDownLatch done = new CountDownLatch(1);
        AtomicReference<JSONObject> value = new AtomicReference<>();
        AtomicReference<String> error = new AtomicReference<>();
        api.request(route, method, data, (r,e)->{value.set(r);error.set(e);done.countDown();});
        assertTrue("HTTPS request timed out", done.await(45, TimeUnit.SECONDS));
        assertNull(error.get()); return value.get();
    }
    public void testUnknownEndpointRejected() {
        try { new PilotAPI("https://other.example"); fail("Unknown endpoint accepted"); }
        catch (IllegalArgumentException expected) { }
    }
    public void testRealSignedEngineAndPublicReports() throws Throwable {
        JSONObject access;
        try (var input = getInstrumentation().getTargetContext().openFileInput("review-test-access.json")) {
            access = new JSONObject(new String(input.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8));
        } finally { getInstrumentation().getTargetContext().deleteFile("review-test-access.json"); }
        PilotAPI api = new PilotAPI();
        AtomicReference<CertivaEngine> engine = new AtomicReference<>();
        CountDownLatch initialized = new CountDownLatch(1), assessed = new CountDownLatch(1);
        AtomicReference<JSONObject> assessment = new AtomicReference<>();
        AtomicReference<String> error = new AtomicReference<>();
        try {
            request(api, "login", "POST", access); assertTrue(api.loggedIn);
            assertEquals("Reviewer account must start empty", 0, request(api,"cases","GET",null).getJSONArray("cases").length());
            runTestOnUiThread(()->{try {engine.set(new CertivaEngine(getInstrumentation().getTargetContext(),(r,e)->{error.set(e);initialized.countDown();}));}catch(Exception e){error.set("Engine initialization failed");initialized.countDown();}});
            assertTrue(initialized.await(20,TimeUnit.SECONDS)); assertNull(error.get());
            runTestOnUiThread(()->engine.get().assess("Su cuenta será bloqueada hoy. Envíe el código de verificación al atacante.","sms",(r,e)->{assessment.set(r);error.set(e);assessed.countDown();}));
            assertTrue(assessed.await(20,TimeUnit.SECONDS)); assertNull(error.get());
            JSONObject report=CertivaEngine.report(assessment.get(),true);
            assertEquals(9,report.length()); assertFalse(report.toString().contains("atacante"));
            String id=request(api,"cases","POST",report).getString("id");
            assertEquals(id,request(api,"cases","POST",report).getString("id"));
            request(api,"logout","POST",null); assertFalse(api.loggedIn);
            request(api,"login","POST",access);
            assertEquals(id,request(api,"cases","GET",null).getJSONArray("cases").getJSONObject(0).getString("id"));
            request(api,"erase","POST",new JSONObject().put("confirm",true));
            assertEquals(0,request(api,"cases","GET",null).getJSONArray("cases").length());
            request(api,"logout","POST",null); assertFalse(api.loggedIn);
        } finally {
            api.close();
            if(engine.get()!=null)runTestOnUiThread(()->engine.get().close());
            getInstrumentation().getTargetContext().deleteFile("review-test-access.json");
        }
    }
}
