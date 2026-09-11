package local.certiva.pilot;

import android.app.Activity;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.RippleDrawable;
import android.view.WindowInsetsController;
import android.widget.Button;
import android.widget.LinearLayout;

final class ProtectionStyle {
    static void bars(Activity activity){
        WindowInsetsController controller=activity.getWindow().getInsetsController();
        if(controller!=null)controller.setSystemBarsAppearance(WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS|WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS|WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
    }
    static void button(Button button,boolean primary){
        float density=button.getResources().getDisplayMetrics().density;
        int blue=Color.rgb(32,80,148);
        GradientDrawable background=new GradientDrawable();background.setColor(primary?blue:Color.WHITE);background.setCornerRadius(14*density);background.setStroke(Math.max(1,Math.round(density)),primary?blue:Color.rgb(211,223,239));
        button.setBackgroundTintList(null);
        button.setBackground(new RippleDrawable(ColorStateList.valueOf(Color.argb(35,32,80,148)),background,null));
        button.setTextColor(primary?Color.WHITE:blue);button.setTextSize(15);button.setTypeface(Typeface.DEFAULT,Typeface.BOLD);button.setElevation(0);button.setAllCaps(false);
        var params=(LinearLayout.LayoutParams)button.getLayoutParams();params.bottomMargin=Math.round(10*density);button.setLayoutParams(params);
    }
}
