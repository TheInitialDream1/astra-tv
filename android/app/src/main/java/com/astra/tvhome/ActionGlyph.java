package com.astra.tvhome;
import android.graphics.*;
import android.graphics.drawable.Drawable;
/** Small native vector controls; raster assets are reserved for actual application logos. */
final class ActionGlyph extends Drawable {
    final String name;final Paint p=new Paint(Paint.ANTI_ALIAS_FLAG);ActionGlyph(String n){name=n;}
    @Override public void draw(Canvas c){Rect b=getBounds();c.save();c.translate(b.left,b.top);c.scale(b.width()/32f,b.height()/32f);p.setColor(0xffe5e5ea);p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(1.25f);p.setStrokeCap(Paint.Cap.ROUND);
        if(name.equals("apps")){for(int x:new int[]{5,19})for(int y:new int[]{5,19})c.drawRoundRect(x,y,x+8,y+8,1.5f,1.5f,p);}
        else if(name.equals("inputs")){c.drawRoundRect(4,6,28,23,2,2,p);c.drawLine(12,27,21,27,p);c.drawLine(16,23,16,27,p);c.drawLine(9,14,23,14,p);c.drawLine(19,10,23,14,p);c.drawLine(19,18,23,14,p);}
        else if(name.equals("cast")){c.drawRoundRect(5,6,28,23,2,2,p);c.drawArc(-8,17,14,39,270,90,false,p);c.drawArc(-4,21,10,35,270,90,false,p);p.setStyle(Paint.Style.FILL);c.drawCircle(4,27,1.3f,p);}
        else {c.drawRoundRect(5,7,27,25,2,2,p);Path path=new Path();path.moveTo(13,12);path.lineTo(21,16);path.lineTo(13,21);path.close();c.drawPath(path,p);}c.restore();}
    @Override public void setAlpha(int a){p.setAlpha(a);}@Override public void setColorFilter(ColorFilter f){p.setColorFilter(f);}@Override public int getOpacity(){return PixelFormat.TRANSLUCENT;}
}
