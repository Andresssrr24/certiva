package local.certiva.pilot;

import android.app.Activity;
import android.content.res.ColorStateList;
import android.graphics.*;
import android.graphics.drawable.*;
import android.view.*;
import android.widget.*;

/** Shared Android surfaces, type hierarchy and accessible touch targets. */
final class ProtectionStyle {
    static final int BLUE=0xff205094, INK=0xff192e49, MUTED=0xff63748a, SURFACE=0xfff7f9fe, TONAL=0xffe7eefb;
    static int dp(View v,int n){return Math.round(n*v.getResources().getDisplayMetrics().density);}
    static GradientDrawable shape(int color,float radius){GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(radius);return d;}
    static void bars(Activity a){
        WindowInsetsController c=a.getWindow().getInsetsController();
        if(c!=null)c.setSystemBarsAppearance(WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS|WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS|WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
    }
    static LinearLayout screen(Activity a){
        ScrollView scroll=new ScrollView(a);scroll.setFillViewport(true);scroll.setClipToPadding(false);scroll.setBackgroundColor(SURFACE);
        LinearLayout root=new LinearLayout(a);root.setOrientation(LinearLayout.VERTICAL);root.setPadding(dp(root,24),dp(root,48),dp(root,24),dp(root,24));scroll.addView(root);a.setContentView(scroll);bars(a);
        root.setOnApplyWindowInsetsListener((v,i)->{android.graphics.Insets b=i.getInsets(WindowInsets.Type.systemBars());v.setPadding(dp(v,24),b.top+dp(v,12),dp(v,24),b.bottom+dp(v,24));return i;});return root;
    }
    static TextView text(LinearLayout parent,String value,int size,boolean bold){
        TextView t=new TextView(parent.getContext());t.setText(value);t.setTextSize(size);t.setTextColor(size<=14?MUTED:INK);t.setFontFeatureSettings("kern");t.setIncludeFontPadding(false);t.setLineSpacing(dp(t,3),1);t.setTypeface(Typeface.create("sans-serif",bold?Typeface.BOLD:Typeface.NORMAL));t.setPadding(0,dp(t,7),0,dp(t,9));parent.addView(t);return t;
    }
    static void header(LinearLayout parent,String section){
        LinearLayout row=new LinearLayout(parent.getContext());row.setGravity(Gravity.CENTER_VERTICAL);row.setPadding(0,dp(row,4),0,dp(row,22));parent.addView(row);
        TextView brand=new TextView(row.getContext());brand.setText("certiva");brand.setTextColor(BLUE);brand.setTextSize(29);brand.setTypeface(Typeface.create("sans-serif",Typeface.BOLD));brand.setLetterSpacing(-.045f);row.addView(brand,new LinearLayout.LayoutParams(0,-2,1));
        TextView label=new TextView(row.getContext());label.setText(section);label.setTextSize(12);label.setTextColor(MUTED);row.addView(label);
    }
    static LinearLayout card(LinearLayout parent,int color){
        LinearLayout box=new LinearLayout(parent.getContext());box.setOrientation(LinearLayout.VERTICAL);box.setPadding(dp(box,20),dp(box,15),dp(box,20),dp(box,15));box.setBackground(shape(color,dp(box,26)));LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.bottomMargin=dp(box,16);p.topMargin=dp(box,8);parent.addView(box,p);return box;
    }
    static void shield(LinearLayout parent){
        View icon=new View(parent.getContext()){
            final Paint paint=new Paint(3);
            @Override protected void onDraw(Canvas c){super.onDraw(c);c.save();c.scale(getWidth()/64f,getHeight()/64f);paint.setColor(TONAL);paint.setStyle(Paint.Style.FILL);c.drawRoundRect(0,0,64,64,23,23,paint);paint.setColor(BLUE);paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(2.3f);paint.setStrokeJoin(Paint.Join.ROUND);Path p=new Path();p.moveTo(32,14);p.lineTo(47,20);p.lineTo(47,32);p.cubicTo(47,43,32,51,32,51);p.cubicTo(32,51,17,43,17,32);p.lineTo(17,20);p.close();c.drawPath(p,paint);p.reset();p.moveTo(25,31);p.lineTo(30,36);p.lineTo(39,26);c.drawPath(p,paint);c.restore();}
        };LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(dp(icon,64),dp(icon,64));p.bottomMargin=dp(icon,15);parent.addView(icon,p);icon.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
    }
    static void statusRow(LinearLayout parent,String title,boolean complete){
        LinearLayout row=new LinearLayout(parent.getContext());row.setGravity(Gravity.CENTER_VERTICAL);row.setPadding(0,dp(row,10),0,dp(row,10));parent.addView(row);
        TextView indicator=new TextView(row.getContext());indicator.setText(complete?"✓":"○");indicator.setTextColor(complete?BLUE:MUTED);indicator.setTextSize(18);indicator.setGravity(Gravity.CENTER);indicator.setBackground(shape(complete?TONAL:0xfff0f2f6,dp(row,12)));row.addView(indicator,new LinearLayout.LayoutParams(dp(row,32),dp(row,32)));
        TextView text=new TextView(row.getContext());text.setText(title);text.setTextSize(14);text.setTextColor(INK);text.setPadding(dp(row,12),0,0,0);row.addView(text,new LinearLayout.LayoutParams(0,-2,1));
        TextView state=new TextView(row.getContext());state.setText(complete?"Listo":"Pendiente");state.setTextColor(MUTED);state.setTextSize(11);row.addView(state);
    }
    static void button(Button b,boolean primary){
        b.setBackgroundTintList(null);b.setBackground(new RippleDrawable(ColorStateList.valueOf(0x30205094),shape(primary?BLUE:TONAL,dp(b,28)),null));
        b.setTextColor(new ColorStateList(new int[][]{new int[]{-android.R.attr.state_enabled},new int[]{}},new int[]{0xff8b9aad,primary?Color.WHITE:BLUE}));b.setTextSize(14);b.setTypeface(Typeface.create("sans-serif-medium",Typeface.NORMAL));b.setElevation(0);b.setAllCaps(false);b.setMinHeight(dp(b,52));b.setPadding(dp(b,16),dp(b,8),dp(b,16),dp(b,8));
        var p=(LinearLayout.LayoutParams)b.getLayoutParams();p.height=-2;p.bottomMargin=dp(b,10);b.setLayoutParams(p);
    }
    static void disclosure(LinearLayout parent,String title,String body){
        Button toggle=new Button(parent.getContext());toggle.setText(title+"  +");parent.addView(toggle,new LinearLayout.LayoutParams(-1,-2));button(toggle,false);
        TextView detail=text(parent,body,13,false);detail.setVisibility(View.GONE);toggle.setOnClickListener(v->{boolean show=detail.getVisibility()!=View.VISIBLE;detail.setVisibility(show?View.VISIBLE:View.GONE);toggle.setText(title+(show?"  −":"  +"));});
    }
}
