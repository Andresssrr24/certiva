package local.certiva.pilot;

import android.app.NotificationManager;
import android.accessibilityservice.AccessibilityService;

/** Native notification rendering with controlled content; no message or inference. */
public final class NotificationBrandingTest extends UiFixtureFlowTest {
    @Override public void testTapOpensDetailAndReport() throws Throwable {
        var context=getInstrumentation().getTargetContext();
        var automation=getInstrumentation().getUiAutomation();
        var info=automation.getServiceInfo();info.flags|=android.accessibilityservice.AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS;automation.setServiceInfo(info);
        assertTrue(automation.performGlobalAction(AccessibilityService.GLOBAL_ACTION_HOME));
        runTestOnUiThread(()->ProtectionNotifications.post(context,ProtectionStore.get(context,"ui-fixture-alert")));
        var manager=context.getSystemService(NotificationManager.class);
        long postedDeadline=System.currentTimeMillis()+5000;
        while(manager.getActiveNotifications().length==0&&System.currentTimeMillis()<postedDeadline)android.os.SystemClock.sleep(100);
        var posted=manager.getActiveNotifications();
        assertEquals("Fixture notification must be published",1,posted.length);
        var notification=posted[0].getNotification();
        assertEquals(R.drawable.ic_certiva_notification,notification.getSmallIcon().getResId());
        assertEquals(R.drawable.ic_certiva_notification,notification.publicVersion.getSmallIcon().getResId());
        assertNotNull(notification.getLargeIcon());
        assertNotNull(notification.getSmallIcon().loadDrawable(context));
        assertTrue(automation.performGlobalAction(AccessibilityService.GLOBAL_ACTION_NOTIFICATIONS));
        long deadline=System.currentTimeMillis()+30000;boolean visible=false;
        while(!visible&&System.currentTimeMillis()<deadline){
            for(var window:automation.getWindows())if(hasTitle(window.getRoot(),0)){visible=true;break;}
            if(!visible)android.os.SystemClock.sleep(300);
        }
        assertTrue("Certiva notification title must be visible in Android",visible);
        android.os.SystemClock.sleep(1500);
        screenshot("android-protection-notification.png");
    }
    private boolean hasTitle(android.view.accessibility.AccessibilityNodeInfo node,int depth){
        if(node==null||depth>20)return false;
        if(node.isVisibleToUser()&&node.getText()!=null&&node.getText().toString().contains("Antes de responder, revisa esto"))return true;
        for(int i=0;i<node.getChildCount();i++)if(hasTitle(node.getChild(i),depth+1))return true;
        return false;
    }
}
