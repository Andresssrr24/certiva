package local.certiva.pilot;

import android.os.Handler;
import android.os.Looper;
import org.json.JSONObject;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

final class PilotAPI {
    interface Callback { void done(JSONObject result, String error); }
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());
    private String cookie = "", csrf = "";
    private final String origin;
    volatile boolean loggedIn;
    PilotAPI() { this("http://127.0.0.1:4320"); }
    PilotAPI(String origin) {
        if (!origin.equals("http://127.0.0.1:4320") && !origin.equals("http://127.0.0.1:4321")) throw new IllegalArgumentException("Only local pilot endpoints are permitted");
        this.origin = origin;
    }
    void request(String route, String method, JSONObject data, Callback callback) {
        executor.execute(() -> {
            HttpURLConnection connection = null;
            try {
                connection = (HttpURLConnection)new URL(origin + "/api/" + route).openConnection();
                connection.setInstanceFollowRedirects(false); connection.setRequestMethod(method);
                connection.setConnectTimeout(10000); connection.setReadTimeout(10000);
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setRequestProperty("Cookie", cookie); connection.setRequestProperty("X-CSRF-Token", csrf);
                if (data != null) { connection.setDoOutput(true); try(var out = connection.getOutputStream()) { out.write(data.toString().getBytes(StandardCharsets.UTF_8)); } }
                int status = connection.getResponseCode();
                var stream = status < 400 ? connection.getInputStream() : connection.getErrorStream();
                JSONObject result;
                try(stream) { result = new JSONObject(new String(stream.readNBytes(512000), StandardCharsets.UTF_8)); }
                if (status >= 400) { if(status == 401) { loggedIn=false; cookie=""; csrf=""; } throw new Exception(result.optString("error", "No se pudo completar la operación")); }
                if (route.equals("login")) {
                    String header = connection.getHeaderField("Set-Cookie");
                    cookie = header == null ? "" : header.split(";")[0]; csrf = result.optString("csrf");
                    loggedIn = result.optString("role").equals("cliente");
                    if (!loggedIn) throw new Exception("Usa un acceso de cliente. El equipo de fraude entra desde la consola web.");
                }
                if (route.equals("logout")) { loggedIn=false; cookie=""; csrf=""; }
                main.post(() -> callback.done(result, null));
            } catch (Exception error) { main.post(() -> callback.done(null, error.getMessage() == null ? "No se pudo contactar el servidor local" : error.getMessage())); }
            finally { if(connection != null) connection.disconnect(); }
        });
    }
    void close() { executor.shutdownNow(); loggedIn=false; cookie=""; csrf=""; }
}
