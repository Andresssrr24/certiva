package local.certiva.sdk;

import android.content.Context;
import android.os.Looper;
import android.util.Base64;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import org.json.JSONObject;
import org.json.JSONTokener;
import java.nio.charset.StandardCharsets;
import org.bouncycastle.crypto.params.Ed25519PublicKeyParameters;
import org.bouncycastle.crypto.signers.Ed25519Signer;
import java.util.UUID;

/** Main-thread, local-only evaluator. No network, storage, JavaScript interface or remote navigation. */
public final class CertivaEngine {
    public interface Callback { void complete(JSONObject result, String error); }
    private final WebView runtime;
    private boolean ready;
    public CertivaEngine(Context context, Callback initialized) throws Exception {
        if (Looper.myLooper() != Looper.getMainLooper()) throw new IllegalStateException("Use the main thread");
        JSONObject envelope = new JSONObject(read(context, "policy.json"));
        byte[] payload = Base64.decode(envelope.getString("payload"), Base64.DEFAULT);
        byte[] rawKey = Base64.decode(read(context, "policy-key.txt").trim(), Base64.DEFAULT);
        // Lightweight bundled verifier: no dependency on the OEM JCA provider.
        Ed25519Signer signature = new Ed25519Signer();
        signature.init(false, new Ed25519PublicKeyParameters(rawKey, 0));
        signature.update(payload, 0, payload.length);
        if (!signature.verifySignature(Base64.decode(envelope.getString("signature"), Base64.DEFAULT))) throw new SecurityException("Configuración alterada");
        String policy = new JSONObject(new String(payload, StandardCharsets.UTF_8)).toString();
        String script = read(context, "certiva.js");
        runtime = new WebView(context);
        runtime.getSettings().setJavaScriptEnabled(true);
        runtime.getSettings().setAllowFileAccess(false);
        runtime.getSettings().setAllowContentAccess(false);
        runtime.getSettings().setBlockNetworkLoads(true);
        runtime.getSettings().setDomStorageEnabled(false);
        runtime.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { return true; }
            @Override public void onPageFinished(WebView view, String url) {
                view.evaluateJavascript("typeof Certiva === 'object' && typeof policy === 'object'", result -> {
                    ready = "true".equals(result);
                    initialized.complete(null, ready ? null : "No se pudo iniciar el motor local");
                });
            }
        });
        // Data never appears in HTML source: input later crosses evaluateJavascript as JSON.
        runtime.loadDataWithBaseURL("https://certiva.invalid/", "<html><head><meta charset='utf-8'></head><body><script>" + script + "\nconst policy=" + policy + ";Certiva.validatePolicy(policy);</script></body></html>", "text/html", "UTF-8", null);
    }
    private static String read(Context context, String file) throws Exception {
        try (var stream = context.getAssets().open(file)) { return new String(stream.readAllBytes(), StandardCharsets.UTF_8); }
    }
    public void assess(String text, String channel, Callback callback) {
        if (!ready) { callback.complete(null, "El motor está iniciando"); return; }
        if (text.length() > 12000) { callback.complete(null, "El mensaje supera 12.000 caracteres"); return; }
        try {
            JSONObject input = new JSONObject().put("id", UUID.randomUUID().toString()).put("text", text).put("channel", channel).put("source", "texto");
            runtime.evaluateJavascript("JSON.stringify(Certiva.assess(" + input + ",policy))", value -> {
                try { Object decoded = new JSONTokener(value).nextValue(); callback.complete(new JSONObject((String) decoded), null); }
                catch (Exception error) { callback.complete(null, "No pudimos verificar el contenido"); }
            });
        } catch (Exception error) { callback.complete(null, "Entrada inválida"); }
    }
    public static JSONObject report(JSONObject result, boolean consent) throws Exception {
        if (!consent) throw new IllegalArgumentException("Se requiere confirmación del cliente");
        var codes = new org.json.JSONArray(); var reasons = result.getJSONArray("reasons");
        for (int i=0; i<reasons.length(); i++) codes.put(reasons.getJSONObject(i).getString("code"));
        return new JSONObject().put("assessmentId", result.getString("id")).put("outcome", result.getString("outcome"))
            .put("reasonCodes", codes).put("channel", result.getString("channel")).put("source", result.getString("source"))
            .put("evaluatedAt", result.getString("evaluatedAt")).put("policyVersion", result.getString("policyVersion"))
            .put("sdkVersion", result.getString("sdkVersion")).put("consent", true);
    }
    public void close() { ready = false; runtime.destroy(); }
}
