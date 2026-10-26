package com.astra.tvhome;
import android.content.Context;import android.graphics.*;import android.view.View;import java.text.SimpleDateFormat;import java.util.*;
/** Quiet, drifting clock shared by the app's idle screen and Android's Dream service. */
final class ClockFace extends View {
    final Paint p=new Paint(3);final android.content.SharedPreferences preferences;
    ClockFace(Context c){super(c);preferences=c.getSharedPreferences("MainActivity",0);setBackgroundColor(0xff010307);}
    protected void onDraw(Canvas c){float s=getWidth()/1280f;long now=System.currentTimeMillis();float x=getWidth()*.5f+(float)Math.sin(now/97000.)*32*s,y=getHeight()*.49f+(float)Math.cos(now/113000.)*24*s;p.setShader(new RadialGradient(x,y,360*s,new int[]{0x14234b8c,0x00000000},null,Shader.TileMode.CLAMP));c.drawRect(0,0,getWidth(),getHeight(),p);p.setShader(null);p.setTextAlign(Paint.Align.CENTER);p.setTypeface(Typeface.create("sans-serif-thin",0));p.setColor(0xfff5f5f7);p.setTextSize(118*s);c.drawText(new SimpleDateFormat("HH:mm",Locale.CHINA).format(new Date(now)),x,y,p);p.setTypeface(Typeface.create("sans-serif-light",0));p.setTextSize(21*s);p.setColor(0xffbbc5d7);c.drawText(new SimpleDateFormat("M月d日  EEEE",Locale.CHINA).format(new Date(now)),x,y+49*s,p);p.setTextSize(18*s);c.drawText(preferences.getBoolean("weatherEnabled",true)?preferences.getString("weatherCache",""):"",x,y+88*s,p);postInvalidateDelayed(1000);}
}
