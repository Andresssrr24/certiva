package local.certiva.pilot;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import org.json.JSONObject;

final class ProtectionNotifications {
    static final String CHANNEL = "certiva_risk_alerts";
    static void channel(Context context) {
        NotificationChannel channel = new NotificationChannel(CHANNEL,"Alertas de protección",NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Señales de riesgo detectadas localmente en notificaciones de WhatsApp");
        channel.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);
        context.getSystemService(NotificationManager.class).createNotificationChannel(channel);
    }
    static boolean allowed(Context context) {
        channel(context);
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        return context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)==PackageManager.PERMISSION_GRANTED && manager.areNotificationsEnabled() && manager.getNotificationChannel(CHANNEL).getImportance()!=NotificationManager.IMPORTANCE_NONE;
    }
    static void post(Context context, JSONObject result) {
        if (!allowed(context)) return;
        String id = result.optString("id");
        Intent open = new Intent(context, ProtectionDetailActivity.class).putExtra("alert_id", id)
            .setData(android.net.Uri.parse("certiva://alert/"+id))
            .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent intent = PendingIntent.getActivity(context, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        String body = "Detectamos señales de riesgo en un mensaje de WhatsApp. Toca para ver el detalle.";
        Notification publicVersion = new Notification.Builder(context, CHANNEL).setSmallIcon(android.R.drawable.ic_lock_lock)
            .setContentTitle("Certiva").setContentText("Tienes una alerta de protección").build();
        Notification notification = new Notification.Builder(context, CHANNEL)
            .setSmallIcon(android.R.drawable.ic_lock_lock).setColor(Color.rgb(32,80,148))
            .setContentTitle("Antes de responder, revisa esto")
            .setContentText(body).setStyle(new Notification.BigTextStyle().bigText(body))
            .setContentIntent(intent).setAutoCancel(true).setCategory(Notification.CATEGORY_STATUS)
            .setVisibility(Notification.VISIBILITY_PRIVATE).setPublicVersion(publicVersion).build();
        if (context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
            context.getSystemService(NotificationManager.class).notify(id, 1, notification);
        }
    }
}
