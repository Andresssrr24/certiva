package local.certiva.pilot;

import android.test.InstrumentationTestCase;
import local.certiva.sdk.CertivaEngine;
import org.json.JSONObject;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

public final class EngineTest extends InstrumentationTestCase {
    public void testRuleRiskSurvivesUnavailableAI() throws Exception {
        JSONObject base = new JSONObject().put("outcome","riesgo").put("source","texto").put("sdkVersion","0.1.0")
            .put("reasons",new org.json.JSONArray().put(new JSONObject().put("code","pide_datos_sensibles")));
        JSONObject retained=local.certiva.qvac.LocalAssessment.retainRuleRisk(base);
        assertEquals("riesgo",retained.getString("outcome"));
        assertEquals("texto",retained.getString("source"));
        assertEquals("reglas_de_texto",retained.getString("coverage"));
        assertEquals("unavailable",retained.getString("aiStatus"));
        assertFalse(retained.has("aiModel"));
        assertEquals("pide_datos_sensibles",retained.getJSONArray("reasons").getJSONObject(0).getString("code"));
        base.put("outcome","sin_senales");
        assertNull(local.certiva.qvac.LocalAssessment.retainRuleRisk(base));
    }
    public void testPilotAPIRoundTrip() throws Throwable {
        PilotAPI api = new PilotAPI("http://127.0.0.1:4321");
        try {
            CountDownLatch login = new CountDownLatch(1), sent = new CountDownLatch(1), listed = new CountDownLatch(1);
            AtomicReference<String> error = new AtomicReference<>();
            AtomicReference<JSONObject> received = new AtomicReference<>();
            api.request("login", "POST", new JSONObject().put("username","android-test").put("password","test-only-password"), (r,e)->{error.set(e);login.countDown();});
            assertTrue(login.await(15,TimeUnit.SECONDS)); assertNull(error.get()); assertTrue(api.loggedIn);
            String timestamp = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").withZone(java.time.ZoneOffset.UTC).format(java.time.Instant.now());
            JSONObject report = new JSONObject().put("assessmentId",java.util.UUID.randomUUID().toString()).put("outcome","riesgo")
                .put("reasonCodes",new org.json.JSONArray().put("pide_datos_sensibles")).put("channel","sms").put("source","texto")
                .put("evaluatedAt",timestamp).put("policyVersion","ca-referencia-2026-09-v1").put("sdkVersion","0.1.0").put("consent",true);
            api.request("cases","POST",report,(r,e)->{received.set(r);error.set(e);sent.countDown();});
            assertTrue(sent.await(15,TimeUnit.SECONDS)); assertNull(error.get()); assertEquals("nuevo",received.get().getString("state"));
            String id=received.get().getString("id");
            api.request("cases","GET",null,(r,e)->{received.set(r);error.set(e);listed.countDown();});
            assertTrue(listed.await(15,TimeUnit.SECONDS)); assertNull(error.get());
            assertTrue(received.get().toString().contains(id));
        } finally { api.close(); }
    }
    public void testSignedEngineAndMinimalReport() throws Throwable {
        CountDownLatch initialized = new CountDownLatch(1), finished = new CountDownLatch(1);
        AtomicReference<CertivaEngine> engine = new AtomicReference<>();
        AtomicReference<String> error = new AtomicReference<>();
        AtomicReference<JSONObject> result = new AtomicReference<>();
        runTestOnUiThread(() -> {
            try { engine.set(new CertivaEngine(getInstrumentation().getTargetContext(), (r,e)-> {error.set(e); initialized.countDown();})); }
            catch(Exception e){error.set(e.toString());initialized.countDown();}
        });
        try {
            assertTrue("Engine initialization timed out", initialized.await(20,TimeUnit.SECONDS));
            assertNull(error.get());
            runTestOnUiThread(() -> engine.get().assess("Su cuenta será bloqueada hoy. Envíe el código de verificación al atacante.", "sms", (r,e)-> {result.set(r);error.set(e);finished.countDown();}));
            assertTrue(finished.await(10,TimeUnit.SECONDS)); assertNull(error.get());
            assertEquals("riesgo",result.get().getString("outcome"));
            JSONObject report = CertivaEngine.report(result.get(),true);
            assertEquals(9,report.length()); assertFalse(report.toString().contains("atacante"));
            try {CertivaEngine.report(result.get(),false);fail("Consent must be required");}catch(IllegalArgumentException expected){}
        } finally { if(engine.get()!=null)runTestOnUiThread(() -> engine.get().close()); }
    }
}
