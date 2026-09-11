package local.certiva.pilot;

import android.app.Notification;
import android.app.NotificationManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.UserHandle;
import android.service.notification.StatusBarNotification;
import android.test.ServiceTestCase;
import org.json.JSONObject;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/** Native pipeline test with a synthetic WhatsApp notification; not a claim of live WhatsApp delivery. */
public final class ProtectionTest extends ServiceTestCase<CertivaNotificationListener> {
    public ProtectionTest(){super(CertivaNotificationListener.class);}
    private void ui(Runnable action)throws Exception{
        CountDownLatch latch=new CountDownLatch(1);final Throwable[] error=new Throwable[1];
        new Handler(Looper.getMainLooper()).post(()->{try{action.run();}catch(Throwable e){error[0]=e;}finally{latch.countDown();}});
        assertTrue(latch.await(25,TimeUnit.SECONDS));if(error[0]!=null)throw new RuntimeException(error[0]);
    }
    public void testContentFiltering(){
        assertTrue(NotificationContent.supported("com.whatsapp"));assertTrue(NotificationContent.supported("com.whatsapp.w4b"));
        assertFalse(NotificationContent.supported("local.certiva.pilot"));assertFalse(NotificationContent.supported("com.other.app"));
        Notification n=new Notification();n.extras=new Bundle();n.extras.putCharSequence(Notification.EXTRA_TEXT,"fallback");
        Bundle last=new Bundle();last.putCharSequence("text","latest message");n.extras.putParcelableArray(Notification.EXTRA_MESSAGES,new Bundle[]{last});
        assertEquals("latest message",NotificationContent.text(n));n.flags|=Notification.FLAG_GROUP_SUMMARY;assertEquals("",NotificationContent.text(n));
    }
    public void testNotificationToLocalAlertAndTapIntent()throws Exception{
        var context=getContext();var prefs=ProtectionStore.prefs(context);prefs.edit().clear().putBoolean("enabled",true).commit();
        context.getSystemService(NotificationManager.class).cancelAll();
        ui(()->startService(new android.content.Intent(context,CertivaNotificationListener.class)));
        Notification risky=new Notification.Builder(context,"fixture").setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("Synthetic sender").setContentText("Su cuenta será bloqueada hoy. Envíe el código de verificación al atacante.").build();
        StatusBarNotification sbn=new StatusBarNotification("com.whatsapp","com.whatsapp",41,"test",android.os.Process.myUid(),0,0,risky,android.os.Process.myUserHandle(),System.currentTimeMillis());
        try{
            ui(()->getService().onNotificationPosted(sbn));
            long deadline=System.currentTimeMillis()+30000;
            while(ProtectionStore.alerts(context).length()==0&&System.currentTimeMillis()<deadline)Thread.sleep(100);
            var alerts=ProtectionStore.alerts(context);assertEquals(1,alerts.length());JSONObject result=alerts.getJSONObject(0);
            assertEquals("riesgo",result.getString("outcome"));
            String saved=prefs.getString("alerts","");assertFalse(saved.contains("atacante"));assertFalse(saved.contains("Synthetic sender"));
            var manager=context.getSystemService(NotificationManager.class);
            long postedDeadline=System.currentTimeMillis()+10000;
            while(manager.getActiveNotifications().length==0 && System.currentTimeMillis()<postedDeadline)Thread.sleep(100);
            var posted=manager.getActiveNotifications();assertEquals(1,posted.length);
            assertNotNull(posted[0].getNotification().contentIntent);
            assertEquals("local.certiva.pilot",posted[0].getNotification().contentIntent.getCreatorPackage());
            assertEquals(NotificationManager.IMPORTANCE_HIGH,context.getSystemService(NotificationManager.class).getNotificationChannel(ProtectionNotifications.CHANNEL).getImportance());
            posted[0].getNotification().contentIntent.send();
            ui(()->getService().onNotificationPosted(sbn));Thread.sleep(400);assertEquals(1,ProtectionStore.alerts(context).length());
            prefs.edit().putBoolean("enabled",false).commit();
            StatusBarNotification another=new StatusBarNotification("com.whatsapp","com.whatsapp",42,"disabled",android.os.Process.myUid(),0,0,risky,android.os.Process.myUserHandle(),System.currentTimeMillis());
            ui(()->getService().onNotificationPosted(another));Thread.sleep(400);assertEquals(1,ProtectionStore.alerts(context).length());
        }finally{prefs.edit().putBoolean("enabled",false).commit();ui(this::shutdownService);}
    }
    public void testAlertStorageBoundAndExpiration()throws Exception{
        var context=getContext();ProtectionStore.prefs(context).edit().remove("alerts").commit();
        JSONObject base=new JSONObject().put("id","id").put("outcome","riesgo").put("reasons",new org.json.JSONArray()).put("text","do-not-store");
        for(int i=0;i<23;i++){base.put("id","id-"+i);ProtectionStore.save(context,base);}
        assertEquals(20,ProtectionStore.alerts(context).length());assertNull(ProtectionStore.get(context,"id-0"));assertNotNull(ProtectionStore.get(context,"id-22"));
        assertFalse(ProtectionStore.prefs(context).getString("alerts","").contains("do-not-store"));
        var expired=new org.json.JSONArray().put(new JSONObject().put("receivedAt",0).put("id","old"));
        ProtectionStore.prefs(context).edit().putString("alerts",expired.toString()).commit();assertEquals(0,ProtectionStore.alerts(context).length());
    }
}
