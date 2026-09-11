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
    private static final String PUBLIC_ORIGIN = "https://certiva-landing.vercel.app";
    PilotAPI() { this(PUBLIC_ORIGIN); }
    PilotAPI(String origin) {
        if (!origin.equals(PUBLIC_ORIGIN) && !(BuildConfig.DEBUG && (origin.equals("http://127.0.0.1:4320") || origin.equals("http://127.0.0.1:4321")))) throw new IllegalArgumentException("Endpoint no permitido");
        this.origin = origin;
    }
    void request(String route, String method, JSONObject data, Callback callback) {
        if (!java.util.List.of("login", "logout", "session", "cases", "erase").contains(route) || !java.util.List.of("GET", "POST").contains(method)) throw new IllegalArgumentException("Operación no permitida");
        executor.execute(() -> {
            HttpURLConnection connection = null;
            try {
                connection = (HttpURLConnection)new URL(origin + (origin.equals(PUBLIC_ORIGIN) ? "/api/reports/" : "/api/") + route).openConnection();
                connection.setInstanceFollowRedirects(false); connection.setRequestMethod(method);
                connection.setConnectTimeout(15000); connection.setReadTimeout(30000);
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setRequestProperty("Cookie", cookie); connection.setRequestProperty("X-CSRF-Token", csrf);
                if (data != null) { connection.setDoOutput(true); try(var out = connection.getOutputStream()) { out.write(data.toString().getBytes(StandardCharsets.UTF_8)); } }
                int status = connection.getResponseCode();
                var stream = status < 400 ? connection.getInputStream() : connection.getErrorStream();
                JSONObject result;
                if (stream == null) throw new Exception("El servicio no respondió. Vuelve a intentarlo.");
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
            } catch (Exception error) { main.post(() -> callback.done(null, error.getMessage() == null ? "No se pudo contactar el servicio del piloto" : error.getMessage())); }
            finally { if(connection != null) connection.disconnect(); }
        });
    }
    void close() { executor.shutdownNow(); loggedIn=false; cookie=""; csrf=""; }
}
