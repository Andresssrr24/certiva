package local.certiva.pilot;

import android.graphics.Canvas;
import android.graphics.ColorFilter;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.graphics.drawable.Drawable;

/** Small, scalable line icons with no font or network dependency. */
final class NavigationIcon extends Drawable {
    private final String name;
    private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    NavigationIcon(String name, int color) {
        this.name = name;
        paint.setColor(color);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(1.8f);
        paint.setStrokeCap(Paint.Cap.ROUND);
        paint.setStrokeJoin(Paint.Join.ROUND);
    }
    private void line(Canvas c, float... points) {
        Path path = new Path();
        path.moveTo(points[0], points[1]);
        for (int i = 2; i < points.length; i += 2) path.lineTo(points[i], points[i+1]);
        c.drawPath(path, paint);
    }
    @Override public void draw(Canvas c) {
        c.save(); c.translate(getBounds().left, getBounds().top);
        c.scale(getBounds().width()/24f, getBounds().height()/24f);
        switch (name) {
            case "home":
                line(c,3,10,12,3,21,10); line(c,5,9,5,21,10,21,10,15,14,15,14,21,19,21,19,9); break;
            case "scan":
                line(c,8,3,3,3,3,8);line(c,16,3,21,3,21,8);line(c,3,16,3,21,8,21);line(c,21,16,21,21,16,21);line(c,7,12,11,16,17,8);break;
            case "bell":
                Path bell=new Path();bell.moveTo(5,17);bell.lineTo(7,14);bell.lineTo(7,9);bell.cubicTo(7,2,17,2,17,9);bell.lineTo(17,14);bell.lineTo(19,17);bell.close();c.drawPath(bell,paint);c.drawArc(10,18,14,22,0,180,false,paint);break;
            case "menu":
                c.drawRoundRect(3,3,10,10,2,2,paint);c.drawRoundRect(14,3,21,10,2,2,paint);c.drawRoundRect(3,14,10,21,2,2,paint);c.drawRoundRect(14,14,21,21,2,2,paint);break;
            case "shield":
                line(c,12,2,20,5,19,15,12,22,5,15,4,5,12,2);line(c,8,11,11,14,16,8);break;
            case "report":
                c.drawRoundRect(5,3,19,21,2,2,paint);line(c,9,8,15,8);line(c,9,12,15,12);line(c,9,16,13,16);break;
            case "lock":
                c.drawRoundRect(5,10,19,21,2,2,paint);c.drawArc(8,2,16,16,180,180,false,paint);line(c,12,14,12,17);break;
            case "spark":
                line(c,12,2,15,9,22,12,15,15,12,22,9,15,2,12,9,9,12,2);break;
            case "arrow": line(c,9,5,16,12,9,19);break;
            default:
                c.drawCircle(12,12,9,paint);
                if ("help".equals(name)) {c.drawArc(9,6,15,12,180,250,false,paint);line(c,13,12,12,14);c.drawPoint(12,18,paint);}
                else {c.drawPoint(12,7,paint);line(c,12,11,12,17);}break;
        }
        c.restore();
    }
    @Override public void setAlpha(int alpha) { paint.setAlpha(alpha); invalidateSelf(); }
    @Override public void setColorFilter(ColorFilter filter) { paint.setColorFilter(filter); invalidateSelf(); }
    @Override public int getOpacity() { return PixelFormat.TRANSLUCENT; }
}
