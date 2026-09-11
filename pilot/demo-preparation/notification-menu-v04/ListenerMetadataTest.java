package local.certiva.pilot;

import android.app.Notification;
import android.app.NotificationManager;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.service.notification.StatusBarNotification;
import android.test.ServiceTestCase;
import java.nio.file.Files;
import java.nio.charset.StandardCharsets;
import java.io.File;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.json.JSONObject;

/** Diagnostic only: actual listener/engine metadata; no authentication or report submission. */
public final class ListenerMetadataTest extends ServiceTestCase<CertivaNotificationListener> {
    public ListenerMetadataTest(){super(CertivaNotificationListener.class);}
    private void ui(Runnable action)throws Exception {var done=new CountDownLatch(1);var failure=new java.util.concurrent.atomic.AtomicReference<Throwable>();new Handler(Looper.getMainLooper()).post(()->{try{action.run();}catch(Throwable e){failure.set(e);}finally{done.countDown();}});assertTrue(done.await(15,TimeUnit.SECONDS));if(failure.get()!=null)throw new RuntimeException(failure.get());}
    public void testRealListenerMetadata()throws Exception {
        var context=getContext();var prefs=ProtectionStore.prefs(context);
        boolean wasEnabled=prefs.getBoolean("enabled",false);String alerts=prefs.getString("alerts","[]");String status=prefs.getString("last_status",null);long checked=prefs.getLong("last_checked",0);
        String id=null;
        try {
            assertTrue(prefs.edit().putBoolean("enabled",true).commit());ui(()->startService(new Intent(context,CertivaNotificationListener.class)));
            var n=new Notification.Builder(context,"fixture").setSmallIcon(android.R.drawable.ic_dialog_info).setContentText("Su cuenta será bloqueada hoy. Envíe el código de verificación para desbloquearla.").build();
            var sbn=new StatusBarNotification("com.whatsapp","com.whatsapp",7042,"diagnostic",android.os.Process.myUid(),0,0,n,android.os.Process.myUserHandle(),System.currentTimeMillis());
            long started=System.currentTimeMillis();ui(()->getService().onNotificationPosted(sbn));JSONObject result=null;long until=started+30000;
            while(result==null&&System.currentTimeMillis()<until){var items=ProtectionStore.alerts(context);for(int i=0;i<items.length();i++){var item=items.getJSONObject(i);if(item.optLong("receivedAt")>=started){result=item;break;}}if(result==null)Thread.sleep(100);}
            assertNotNull(result);id=result.getString("id");
            var evidence=new JSONObject().put("assessment",result).put("report",local.certiva.sdk.CertivaEngine.report(result,true)).put("deviceTime",System.currentTimeMillis()).put("reportSubmitted",false);
            Files.write(new File(context.getExternalFilesDir(null),"listener-metadata.json").toPath(),evidence.toString(2).getBytes(StandardCharsets.UTF_8));
        }finally{
            ui(this::shutdownService);var edit=prefs.edit().putBoolean("enabled",wasEnabled).putString("alerts",alerts);if(status==null)edit.remove("last_status");else edit.putString("last_status",status);if(checked==0)edit.remove("last_checked");else edit.putLong("last_checked",checked);edit.commit();
            if(id!=null)context.getSystemService(NotificationManager.class).cancel(id,1);
        }
    }
}
