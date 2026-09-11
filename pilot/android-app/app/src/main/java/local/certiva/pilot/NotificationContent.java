package local.certiva.pilot;

import android.app.Notification;
import android.os.Bundle;

/** Reads only content made available by Android; never accesses WhatsApp history. */
final class NotificationContent {
    static boolean supported(String packageName) {
        return "com.whatsapp".equals(packageName) || "com.whatsapp.w4b".equals(packageName);
    }
    static String text(Notification notification) {
        if ((notification.flags & Notification.FLAG_GROUP_SUMMARY) != 0) return "";
        Bundle extras = notification.extras;
        if (extras == null) return "";
        // Prefer the newest message. Avoid reprocessing the whole conversation on group updates.
        var messages = extras.getParcelableArray(Notification.EXTRA_MESSAGES);
        if (messages != null && messages.length > 0 && messages[messages.length - 1] instanceof Bundle) {
            CharSequence latest = ((Bundle) messages[messages.length - 1]).getCharSequence("text");
            if (latest != null && latest.length() > 0) return bounded(latest);
        }
        CharSequence body = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);
        if (body == null || body.length() == 0) body = extras.getCharSequence(Notification.EXTRA_TEXT);
        return body == null ? "" : bounded(body);
    }
    private static String bounded(CharSequence value) { return value.subSequence(0, Math.min(value.length(), 12000)).toString().trim(); }
}
