package local.certiva.pilot;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;

/** Local outcome metadata only. No notification text, sender, code, link or screenshot is persisted. */
final class ProtectionStore {
    static final String PREFS = "certiva_protection";
    static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }
    static boolean enabled(Context c) { return prefs(c).getBoolean("enabled", false); }
    static JSONArray alerts(Context c) {
        JSONArray clean = new JSONArray();
        try {
            JSONArray saved = new JSONArray(prefs(c).getString("alerts", "[]"));
            long oldest = System.currentTimeMillis() - 7L * 24 * 60 * 60 * 1000;
            for (int i = 0; i < saved.length(); i++) {
                JSONObject item = saved.getJSONObject(i);
                if (item.optLong("receivedAt") >= oldest && clean.length() < 20) clean.put(item);
            }
            if (clean.length() != saved.length()) prefs(c).edit().putString("alerts",clean.toString()).apply();
        } catch (Exception ignored) { prefs(c).edit().remove("alerts").apply(); }
        return clean;
    }
    static void save(Context c, JSONObject result) throws Exception {
        // Explicit projection; future SDK fields cannot accidentally persist message content.
        JSONObject item = new JSONObject();
        for (String key : new String[]{"id","outcome","title","action","channel","source","evaluatedAt","policyVersion","sdkVersion","coverage"}) item.put(key,result.optString(key));
        JSONArray reasons = new JSONArray();
        JSONArray original = result.optJSONArray("reasons");
        if (original != null) for (int i=0; i<original.length(); i++) {
            JSONObject reason = original.getJSONObject(i);
            reasons.put(new JSONObject().put("code",reason.optString("code")).put("title",reason.optString("title")));
        }
        item.put("reasons",reasons).put("receivedAt",System.currentTimeMillis());
        JSONArray next = new JSONArray().put(item), previous = alerts(c);
        for (int i=0; i<previous.length() && next.length()<20; i++) next.put(previous.get(i));
        if (!prefs(c).edit().putString("alerts",next.toString()).commit()) throw new IllegalStateException("No se pudo guardar la alerta");
    }
    static JSONObject get(Context c, String id) {
        JSONArray items = alerts(c);
        for (int i=0;i<items.length();i++) { JSONObject item=items.optJSONObject(i); if(item!=null && item.optString("id").equals(id)) return item; }
        return null;
    }
}
